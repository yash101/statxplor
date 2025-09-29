import { useState, useCallback, useEffect } from 'react'
import {
  ReactFlow,
  addEdge,
  useNodesState,
  useEdgesState,
  Controls,
  Background,
  BackgroundVariant,
  MiniMap,
} from 'reactflow'
import type { Node, Edge, Connection } from 'reactflow'
import type { ProbabilityNode, SimulationResults } from './types/NodeTypes'
import 'reactflow/dist/style.css'
import './App.css'
import Sidebar from './components/Sidebar'
import CustomNode from './components/CustomNode'
import { decodeNeverGonnaLetYouDown, getRickRollJpg } from './utils/codec.v1'
import usePopup from './components/Popup/usePopup'
import { useSimulator } from './contexts/simulator'
import { ExportDialog } from './components/dialog/ExportDialog'

const nodeTypes = {
  probabilityNode: CustomNode,
}

const initialNodes: Node[] = [
  {
    id: '1',
    type: 'probabilityNode',
    position: { x: 250, y: 100 },
    data: { 
      label: 'Node 1',
      error_term: 0.1,
      outputs: [
        { id: 'out1', label: 'Success', probability: 0.7 },
        { id: 'out2', label: 'Failure', probability: 0.3 }
      ]
    },
  },
  {
    id: '2',
    type: 'probabilityNode',
    position: { x: 500, y: 50 },
    data: { 
      label: 'Success Path',
      error_term: 0.1,
      outputs: [
        { id: 'out3', label: 'Great Success', probability: 0.8 },
        { id: 'out4', label: 'Minor Success', probability: 0.2 }
      ]
    },
  },
  {
    id: '3',
    type: 'probabilityNode',
    position: { x: 500, y: 300 },
    data: { 
      label: 'Failure Recovery',
      error_term: 0.1,
      outputs: [
        { id: 'out5', label: 'Recovered', probability: 0.4 },
        { id: 'out6', label: 'Total Failure', probability: 0.6 }
      ]
    },
  },
];

const initialEdges: Edge[] = [
  {
    id: 'e1-2',
    source: '1',
    target: '2',
    sourceHandle: 'out1',
  },
  {
    id: 'e1-3',
    source: '1',
    target: '3',
    sourceHandle: 'out2',
  },
];

function App() {
  const popup = usePopup();
  const simulator = useSimulator();
  const [nodes, setNodes, onNodesChange] = useNodesState<ProbabilityNode>(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationResults, setSimulationResults] = useState<SimulationResults | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  // Load rickroll.jpg into cache on first load
  useEffect(() => {
    setTimeout(getRickRollJpg, 5000);
  }, []);

  // when nodes are connected
  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const runSimulation = useCallback(() => {
    setIsSimulating(true);

    // Use the v2 simulation engine
    simulator.reset();
    const simHead = simulator.buildSimTree(nodes, edges);
    console.log('Built sim tree:', simHead);
    simulator
      .runSimulation({
        graph: simHead,
        rays: 10000,
        frontierSize: 1000,
        workers: 1,
      })
      .then(() => {
        // After run completes, the simHead has aggregated hits in its nodes
        // You could map these back into a UI-visible results object here
        setIsSimulating(false);
        console.log('Simulation complete. Sim head:', simulator.getResults());
      })
      .catch((err) => {
        console.error(err);
        setIsSimulating(false);
      });
  }, [nodes, edges]);

  const addNewNode = useCallback(() => {
    const newNode: Node = {
      id: `node-${Date.now()}`,
      type: 'probabilityNode',
      position: { x: Math.random() * 400 + 100, y: Math.random() * 300 + 100 },
      data: {
        label: `Node ${nodes.length + 1}`,
        error_term: 0.0,
        outputs: [
          {
            id: `out-${Date.now()}`,
            label: 'Output',
            probability: 0.5
          }
        ]
      }
    }
    setNodes((nds) => [...nds, newNode])
  }, [nodes.length, setNodes]);

  const importFromFile = async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.jpg,.jpeg,.rck,.json'; // allow .rck (your export) as well
    input.value = ''; // reset the input so the same file can be selected again

    input.onchange = async (e: Event) => {
      const target = e.target as HTMLInputElement;
      const file = target.files?.[0];
      if (!file)
        return;

      try {
        // Modern browsers: get an ArrayBuffer directly
        let data: any = null;
        try {
          // Try treating the file as plain JSON first
          const text = await file.text();
          try {
            data = JSON.parse(text);
          } catch {
            // Not plain JSON — fall back to the legacy encoded format
            const arrayBuffer = await file.arrayBuffer();
            data = await decodeNeverGonnaLetYouDown(arrayBuffer);
          }
        } catch (err) {
          console.error('Failed to read/parse file', err);
          throw err;
        }

        if (!data || !data.nodes || !data.edges) {
          alert('Invalid file format. Please select a valid project file.');
          return;
        }

        setSelectedNodeId(null)
        setNodes(data.nodes)
        setEdges(data.edges)
        setSimulationResults(data.simulationResults || null)
      } catch (err) {
        console.error('Error reading file', err);
        alert('Failed to read the file. Please ensure it is a valid project file.');
      }
    };

    // trigger the file picker
    input.click();
  };

  // const exportToFile = async () => {
  //   const data = {
  //     nodes,
  //     edges,
  //     simulationResults,
  //   };

  //   try {
  //     const res = await fetch('/rickroll.jpg');
  //     if (!res.ok) {
  //       alert('Failed to prepare export file. Are you connected to the internet?');
  //       throw new Error(`Failed to fetch rickroll.jpg: ${res.status}`);
  //     }

  //     const arrayBuffer = await res.arrayBuffer();
  //     const blob = await encodeNeverGonnaGiveJSON(data, arrayBuffer);
  //     const url = URL.createObjectURL(blob);
  //     const a = document.createElement('a');
  //     a.href = url;
  //     a.download = 'export.rck';
  //     document.body.appendChild(a);
  //     a.click();

  //     popup.show(
  //       <div className='prose'>
  //         <h1>Export ready!</h1>
  //         <p>Click the link below to download the exported flow. If it doesn't start automatically, right-click the link and choose "Save link as…".</p>
  //         <a href={url} download="export.rck">Download exported flow (.rck)</a>
  //       </div>
  //     );
  //   } catch (err) {
  //     console.error('Error fetching rickroll.jpg', err)
  //   }
  // };

  return (
    <div className="app">
      <div className="flow-container">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onSelectionChange={(params) => {
            const sel = params.nodes?.[0]
            setSelectedNodeId(sel ? sel.id : null)
          }}
          nodeTypes={nodeTypes}
          fitView
        >
          <Controls />
          <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
          <MiniMap />
        </ReactFlow>
      </div>
      <Sidebar 
        onRunSimulation={runSimulation}
        onAddNode={addNewNode}
        isSimulating={isSimulating}
        simulationResults={simulationResults}
        selectedNode={selectedNodeId ? nodes.find(n => n.id === selectedNodeId) as any : null}
        onSaveNode={(nodeId, updated) => {
          setNodes(nds => nds.map(n => n.id === nodeId ? {
            ...n,
            data: {
              ...n.data,
              label: updated.label,
              outputs: updated.outputs,
              error_term: updated.error_term
            }
          } : n))
        }}
        onImport={importFromFile}
        onExport={() => {
          let closePopup: Function = () => {};
          const p = popup.show(
            <ExportDialog
              graphData={{
                nodes,
                edges,
                simulationResults
              }}
              closeDialog={() => closePopup()}
            />
          );
          closePopup = p.close;
        }}
      />
    </div>
  )
}

export default App;
