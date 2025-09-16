import type { Node, Edge } from 'reactflow'
import type { NodeOutput, SimulationResults, SimulationResult, ProbabilityKind } from '../types/NodeTypes'

export class SimulationEngine {
  private nodes: Node[]
  private edges: Edge[]

  constructor(nodes: Node[], edges: Edge[]) {
    this.nodes = nodes
    this.edges = edges
  }

  // Run Monte Carlo simulation
  runSimulation(iterations: number = 10000): SimulationResults {
    const pathCounts = new Map<string, number>()
    
    for (let i = 0; i < iterations; i++) {
      const path = this.simulateSingleRun()
      const pathKey = path.join(' → ')
      pathCounts.set(pathKey, (pathCounts.get(pathKey) || 0) + 1)
    }

    // Convert results to the expected format
    const outcomes: SimulationResult[] = Array.from(pathCounts.entries()).map(([path, count]) => ({
      label: path || 'No path',
      probability: count / iterations,
      count
    })).sort((a, b) => b.count - a.count)

    return {
      totalPaths: iterations,
      outcomes
    }
  }

  private simulateSingleRun(): string[] {
    const path: string[] = []
    
    // Find starting nodes (nodes with no incoming edges)
    const startingNodes = this.nodes.filter(node => 
      !this.edges.some(edge => edge.target === node.id)
    )

    if (startingNodes.length === 0) {
      return ['No starting node found']
    }

    let currentNode: Node | null = startingNodes[0] // Start from first starting node
    path.push(currentNode.data.label)

    // Follow the probability chain
    while (currentNode) {
      const nextNode = this.getNextNode(currentNode)
      if (nextNode && nextNode.nodeId) {
        path.push(nextNode.label)
        const foundNode = this.nodes.find(n => n.id === nextNode.nodeId)
        currentNode = foundNode || null
      } else if (nextNode) {
        path.push(nextNode.label)
        break
      } else {
        break
      }
    }

    return path
  }

  private getNextNode(currentNode: Node): { nodeId: string; label: string } | null {
    const nodeOutputs = currentNode.data.outputs as NodeOutput[]
    
    if (!nodeOutputs || nodeOutputs.length === 0) {
      return null
    }

    // Find which output to follow based on probabilities
    const selectedOutput = this.selectOutputByProbability(nodeOutputs)
    if (!selectedOutput) {
      return null
    }

    // Find the edge connected to this output
    const connectedEdge = this.edges.find(edge => 
      edge.source === currentNode.id && edge.sourceHandle === selectedOutput.id
    )

    if (!connectedEdge) {
      return { nodeId: '', label: selectedOutput.label }
    }

    // Find the target node
    const targetNode = this.nodes.find(n => n.id === connectedEdge.target)
    if (!targetNode) {
      return { nodeId: '', label: selectedOutput.label }
    }

    return { 
      nodeId: targetNode.id, 
      label: selectedOutput.label 
    }
  }

  private selectOutputByProbability(outputs: NodeOutput[]): NodeOutput | null {
    const weights: number[] = outputs.map(o => this.evaluateOutput(o))
    const total = weights.reduce((a, b) => a + b, 0)
    if (total <= 0) return outputs[0] || null
    const r = Math.random() * total
    let acc = 0
    for (let i = 0; i < outputs.length; i++) {
      acc += weights[i]
      if (r <= acc) return outputs[i]
    }
    return outputs[outputs.length - 1] || null
  }

  private evaluateOutput(output: NodeOutput): number {
    try {
      const kind: ProbabilityKind = output.kind || this.inferKind(output)
      if (kind === 'numeric') {
        if (typeof output.probability === 'number') return this.sanitizeNumber(output.probability)
        const parsed = parseFloat(String(output.probability))
        return this.sanitizeNumber(parsed)
      }
      if (kind === 'equation') {
        if (!output.equation) return 0
        // Lazy mathjs import pattern could be added; for now a basic eval sandbox (low risk if user controls input)
        // WARNING: eval usage should be replaced with a real mathjs parser for safety.
        // eslint-disable-next-line no-new-func
        const fn = new Function(`return (${output.equation})`)
        const val = fn()
        return this.sanitizeNumber(val)
      }
      if (kind === 'function') {
        if (!output.fnBody) return 0
        // Provide a context object for future extension
        // eslint-disable-next-line no-new-func
        const fn = new Function('ctx', output.fnBody)
        const val = fn({})
        return this.sanitizeNumber(val)
      }
    } catch (err) {
      console.warn('Probability evaluation error', err, output)
      return 0
    }
    return 0
  }

  private inferKind(output: NodeOutput): ProbabilityKind {
    if (typeof output.probability === 'number') return 'numeric'
    if (output.fnBody) return 'function'
    if (output.equation) return 'equation'
    const str = String(output.probability || '').trim()
    if (/^[0-9.+\-/*()\s]+$/.test(str)) return 'equation'
    return 'numeric'
  }

  private sanitizeNumber(n: unknown): number {
    const v = typeof n === 'number' ? n : parseFloat(String(n))
    if (!isFinite(v) || isNaN(v)) return 0
    return v < 0 ? 0 : v
  }
}