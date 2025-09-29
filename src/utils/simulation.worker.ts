/**
 * Worker entrypoint for Monte Carlo simulation.
 * Messages in:
 *  { type: 'run', id: string|number, runs: number, head: SimNode }
 * Replies:
 *  { id, result: { totalPaths: number, outcomes: Record<string, number> } }
 */

import type { SimNode, SimProbabilities } from "./simulation.v2";

console.log('Simulation worker loaded');

export type WorkerRunMessage = {
  type: 'run',
  rays: number,
  frontierSize: number,
  variable?: string,
  vStart?: number,
  vEnd?: number,
  vStepCount?: number,
  graph: SimNode,
};

export type WorkerStopMessage = {
  type: 'stop',
};

export type WorkerResultsRequest = {
  type: 'results',
};

export type WorkerResultsMessage = {
  type: 'results',
  results: SimNode,
  data: any, // will contain information such as variable sweep parameters, TODO
};

export type WorkerRequestMessage =
  WorkerRunMessage | WorkerStopMessage | WorkerResultsRequest;

/**
 * Generates a uniform random number of [0, 1) using the Web Crypto API.
 * Random steps are 1/2^53 which is pretty fricking precise.
 * Enjoy the floating point math and see if ya can figure out why 53 bits.
 * 
 * The simulations are very sensitive to the quality of randomness!
 * Raise a PR if you have a better idea.
 * 
 * @returns Uniform random number in [0, 1)
 */
export function getUniformRandom() {
  const u32 = new Uint32Array(2);
  crypto.getRandomValues(u32);

  // F64 has a 53 bit significand, so we use the top 53 bits of a 64 bit RNG
  // to get a uniform float in [0, 1)
  const hi = u32[0] >>> 6; // 26 bits
  const lo = u32[1] >>> 5; // 27 bits
  const den = 1.0 / 9007199254740992.0; // 2^-53
  return (hi * 67108864.0 + lo) * den; // 67108864 = 2^26, to shift hi left by 26 bits
}

let shouldStop = false;

self.addEventListener('message', (ev: MessageEvent) => {
  const msg = ev.data as WorkerRequestMessage;
  try {
    if (!msg || typeof msg.type !== 'string') return;
    if (msg.type === 'stop') {
      shouldStop = true;
      return;
    }
    if (msg.type === 'results') {
      // request current graph state
      // no-op for now, worker will reply during simulate
      return;
    }
    if (msg.type === 'run') {
      shouldStop = false;
      // run the simulation asynchronously
      setTimeout(() => {
        try {
          simulate(msg as WorkerRunMessage);
        } catch (err) {
          // @ts-ignore
          self.postMessage({ type: 'error', error: String(err) });
        }
      }, 0);
    }
  } catch (err) {
    // @ts-ignore
    self.postMessage({ type: 'error', error: String(err) });
  }
});

function prepare(simNode: SimNode) {
  // Normalize probabilities
  const queue = [ simNode ];
  const visited = new Set<SimNode>();
  while (queue.length > 0) {
    const node = queue.shift();
    if (!node || visited.has(node))
      continue;

    visited.add(node);
    let pSum = node.probabilities.reduce((sum, p) => sum + p.p, 0) + (node.error_term || 0);
    if (pSum <= 0) {
      // Degenerate case, make all probabilities equal
      const equalP = 1.0 / node.probabilities.length;
      for (const p of node.probabilities)
        p.p = equalP;
    } else {
      // Normal case, just normalize
      for (const p of node.probabilities)
        p.p /= pSum;
    
      if (node.error_term)
        node.error_term /= pSum;
    }

    node.hits = 0;

    for (const p of node.probabilities) {
      for (const next of p.next)
        queue.push(next);
      p.hits = 0;
    }
  }
}

// Find the closest probability index
// to the target value in [0, 1)
// Somewhat optimized for v8's JIT/optimizer
function getClosestProbabilityIndex(probabilities: SimProbabilities[], target: number) {
  const a = probabilities;
  let psum: number = 0.0; // Cumulative probability sum

  for (const i in a) {
    psum += a[i].p;
    if (target < psum)
      return Number(i);
  }

  // Error case which means we randomly select (error_term)
  const random = Math.floor(getUniformRandom() * probabilities.length);
  return random;
}

// TODO: implement an update
function postUpdate(graph: SimNode, data: any) {
  const message: WorkerResultsMessage = {
    type: 'results',
    results: graph,
    data,
  };

  self.postMessage(message);

  // Iterate through the graph and reset hits on all nodes
  const queue = [ graph ];
  const visited = new Set<SimNode>();
  while (queue.length > 0) {
    const node = queue.shift();
    if (!node || visited.has(node))
      continue;

    visited.add(node);
    node.hits = 0;
    for (const p of node.probabilities) {
      p.hits = 0;
      for (const next of p.next)
        queue.push(next);
    }
  }
}

function simulate(message: WorkerRunMessage) {
  // Prepare the graph (normalize probabilities, etc)
  prepare(message.graph);

  // Localize variables for JIT friendliness
  const rays = message.rays;
  // optimization: gets rid of a branch in the inner loop
  const frontierSize = message.frontierSize ?? Number.MAX_SAFE_INTEGER;

  // variable-sweep isn't implemented yet
  // const variable = message.variable;
  // const vStart = message.vStart || 0;
  // const vEnd = message.vEnd || 1;
  // const vStepCount = message.vStepCount || 10;
  // const vStep = (vEnd - vStart) / Math.max(1, vStepCount - 1);

  let raysTraced = 0;
  let nextUpdate = 1;
  let totalNodesSeen = 0;

  // Ray trace rays rays
  while (raysTraced < rays) {
    raysTraced += 1;
    if (raysTraced === nextUpdate) {
      // TODO: send progress update
      nextUpdate = Math.min(16384, nextUpdate * 2);
      postUpdate(message.graph, {
        raysTraced,
        totalNodesSeen,
      });
    }

    if (shouldStop) {
      postUpdate(message.graph, { raysTraced, totalNodesSeen, stopped: true });
      return;
    }

    // Single RT
    let frontier = 0;
    const queue = [ message.graph ];
    while (queue.length > 0) {
      const node = queue.shift();
      if (!node)
        continue;

      if (frontier >= frontierSize) // Stop the BFS because user said to and we might have a non-acyclic graph
        break;

      frontier += 1;
      node.hits += 1;
      totalNodesSeen += 1;

      const next: SimProbabilities = node.probabilities[getClosestProbabilityIndex(node.probabilities, getUniformRandom())];
      queue.push(...next.next);
      for (const nextNode of next.next.filter(Boolean)) {
        nextNode.hits += 1;
      }
    }
  }

  postUpdate(message.graph, {
    raysTraced,
    totalNodesSeen,
  });

  self.postMessage({
    type: 'done',
  });
}
