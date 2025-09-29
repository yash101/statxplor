import React, { useMemo, useState } from 'react';
import type { Edge, Node } from 'reactflow';
import type { SimNode, SimProbabilities } from '../../utils/simulation.v2';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid } from 'recharts';

export type SimulationAnalysisProps = {
  nodes: Node[]; // original reactflow nodes (for labels / metadata)
  edges: Edge[]; // currently unused but may help for future path visualizations
  graph: SimNode; // root sim graph from SimulationEngineV2.buildSimTree (with aggregated hits)
};

// Shape for a single bar entry
interface OutputDatum {
  key: string; // unique key (nodeId:outputId)
  nodeId: string;
  nodeLabel: string;
  outputId: string | null; // null for special root
  outputLabel: string;
  expected: number; // configured probability p (0-1)
  observed: number; // hits ratio (0-1)
  hits: number; // raw hits for this output
  nodeHits: number; // total hits at node
}

// Traverse simulation tree building a list of outputs with their stats.
function flattenSimTree(root: SimNode, rfNodeMap: Map<string, Node>): OutputDatum[] {
  const results: OutputDatum[] = [];
  if (!root) return results;

  const queue: SimNode[] = [root];
  const seen = new Set<SimNode>();

  while (queue.length) {
    const n = queue.shift()!;
    if (seen.has(n)) continue; // guard against cycles (should be DAG)
    seen.add(n);

    const rfNode = rfNodeMap.get(n.id);
    const nodeLabel = (rfNode?.data?.label as string) || n.id;

    (n.probabilities || []).forEach((prob: SimProbabilities) => {
      const nodeHits = n.hits || 0;
      const hits = prob.hits || 0;
      const observed = nodeHits > 0 ? hits / nodeHits : 0;
      const expected = prob.p ?? 0;
      const key = `${n.id}:${prob.id ?? prob.label ?? 'root'}`;
      results.push({
        key,
        nodeId: n.id,
        nodeLabel,
        outputId: prob.id,
        outputLabel: prob.label || '(unnamed)',
        expected,
        observed,
        hits,
        nodeHits,
      });

      // enqueue children
      (prob.next || []).forEach(child => queue.push(child));
    });
  }

  return results;
}

/**
 * SimulationAnalysis
 *
 * Provides an explorer UI (like a file tree) for simulation nodes & their outputs,
 * allowing the user to select which outputs to visualize. A Recharts BarChart
 * compares expected vs observed probabilities for each selected output.
 *
 * Expected probability ("expected") is the configured probability weight (p) on
 * the output edge. Observed probability ("observed") is computed as hits / nodeHits
 * from the aggregated simulation run. Values are displayed as percentages on a 0-1 scale.
 *
 * Future enhancements (ideas):
 *  - Toggle normalization per node vs global.
 *  - Show confidence intervals (Wilson / Clopper-Pearson) given total hits.
 *  - Add path drill-down & sparkline of convergence over time (store time series in workers).
 *  - Allow grouping outputs by label search or tag system.
 */
export const SimulationAnalysis: React.FC<SimulationAnalysisProps> = ({ graph, nodes }) => {
  // Build quick lookup for node labels
  const rfNodeMap = useMemo(() => new Map(nodes.map(n => [n.id, n])), [nodes]);

  const allOutputs = useMemo(() => flattenSimTree(graph, rfNodeMap), [graph, rfNodeMap]);

  // Selection state: track nodes & outputs separately
  const [nodeOpen, setNodeOpen] = useState<Record<string, boolean>>({});
  const [selectedNodes, setSelectedNodes] = useState<Record<string, boolean>>({});
  const [selectedOutputs, setSelectedOutputs] = useState<Record<string, boolean>>({});

  // Initialize expansions for convenience when graph changes
  React.useEffect(() => {
    const newOpen: Record<string, boolean> = {};
    const newNodeSel: Record<string, boolean> = {};
    allOutputs.forEach(o => {
      if (!(o.nodeId in newOpen)) newOpen[o.nodeId] = true;
      if (!(o.nodeId in newNodeSel)) newNodeSel[o.nodeId] = true;
    });
    setNodeOpen(prev => ({ ...newOpen, ...prev }));
    setSelectedNodes(prev => ({ ...newNodeSel, ...prev }));
  }, [allOutputs]);

  const toggleNode = (nodeId: string) => {
    setSelectedNodes(s => ({ ...s, [nodeId]: !s[nodeId] }));
  };

  const toggleOutput = (key: string) => {
    setSelectedOutputs(o => ({ ...o, [key]: !o[key] }));
  };

  const toggleCollapse = (nodeId: string) => {
    setNodeOpen(o => ({ ...o, [nodeId]: !o[nodeId] }));
  };

  const selectAll = () => {
    const nodeSel: Record<string, boolean> = {};
    const outSel: Record<string, boolean> = {};
    allOutputs.forEach(o => { nodeSel[o.nodeId] = true; outSel[o.key] = true; });
    setSelectedNodes(nodeSel);
    setSelectedOutputs(outSel);
  };
  const clearAll = () => { setSelectedNodes({}); setSelectedOutputs({}); };

  // Filter selected outputs for chart
  const chartData = useMemo(() => {
    // Only include outputs when their parent node and output itself are selected (output defaults to selected)
    return allOutputs.filter(o => selectedNodes[o.nodeId] && (selectedOutputs[o.key] ?? true));
  }, [allOutputs, selectedNodes, selectedOutputs]);

  return (
    <div className="flex flex-col gap-4 max-h-[80vh]">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Simulation Analysis</h3>
        <div className="flex gap-2 text-sm">
          <button onClick={selectAll} className="px-2 py-1 rounded bg-blue-600 text-white hover:bg-blue-700">Select All</button>
            <button onClick={clearAll} className="px-2 py-1 rounded bg-gray-200 hover:bg-gray-300">Clear</button>
        </div>
      </div>

      <div className="flex gap-4 overflow-hidden">
        {/* Explorer */}
        <div className="w-64 overflow-y-auto border rounded p-2 text-sm bg-white/60">
          {Array.from(new Set(allOutputs.map(o => o.nodeId))).map(nodeId => {
            const nodeLabel = allOutputs.find(o => o.nodeId === nodeId)?.nodeLabel || nodeId;
            const nodeOutputs = allOutputs.filter(o => o.nodeId === nodeId);
            const open = nodeOpen[nodeId];
            const nodeChecked = selectedNodes[nodeId] ?? false;
            const allNodeOutputsSelected = nodeOutputs.every(o => selectedOutputs[o.key] ?? true);
            return (
              <div key={nodeId} className="mb-2 border-b pb-1">
                <div className="flex items-center gap-1">
                  <button onClick={() => toggleCollapse(nodeId)} className="w-4 text-xs">{open ? '▾' : '▸'}</button>
                  <input
                    type="checkbox"
                    checked={nodeChecked}
                    onChange={() => toggleNode(nodeId)}
                  />
                  <span className="font-medium truncate" title={nodeLabel}>{nodeLabel}</span>
                </div>
                {open && (
                  <div className="ml-5 mt-1 flex flex-col gap-0.5">
                    {nodeOutputs.map(out => {
                      const checked = selectedOutputs[out.key] ?? true; // default on
                      return (
                        <label key={out.key} className="flex items-center gap-1">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleOutput(out.key)}
                          />
                          <span className="truncate" title={out.outputLabel}>{out.outputLabel}</span>
                          <span className="ml-auto text-xs text-gray-500">{(out.observed * 100).toFixed(1)}%</span>
                        </label>
                      );
                    })}
                    {!allNodeOutputsSelected && (
                      <div className="text-[10px] text-gray-400 italic">Some outputs hidden</div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Chart area */}
        <div className="flex-1 h-[420px] border rounded p-2 bg-white/60">
          {chartData.length === 0 ? (
            <div className="flex items-center justify-center h-full text-gray-500 text-sm">Select nodes / outputs to visualize.</div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 50 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="key" angle={-45} textAnchor="end" interval={0} height={80} tick={{ fontSize: 11 }} />
                <YAxis tickFormatter={(v) => `${(v * 100).toFixed(0)}%`} domain={[0, 1]} />
                <Tooltip formatter={(value: any, name: string, _props: any) => {
                  if (typeof value === 'number') return [`${(value * 100).toFixed(2)}%`, name];
                  return [value, name];
                }} />
                <Legend />
                <Bar dataKey="expected" fill="#93c5fd" name="Expected" />
                <Bar dataKey="observed" fill="#2563eb" name="Observed" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
      <div className="text-xs text-gray-500">
        Expected = configured probability; Observed = hits / nodeHits after simulation. Percentages per node outputs (not globally normalized).
      </div>
    </div>
  );
};

export default SimulationAnalysis;
