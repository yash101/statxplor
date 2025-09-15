import { useState, useCallback } from 'react'
import {
  ReactFlow,
  addEdge,
  useNodesState,
  useEdgesState,
  Controls,
  Background,
  BackgroundVariant,
} from 'reactflow'
import type { Node, Edge, Connection } from 'reactflow'
import type { SimulationResults } from './types/NodeTypes'
import 'reactflow/dist/style.css'
import './App.css'
import Sidebar from './components/Sidebar'
import CustomNode from './components/CustomNode'
import { SimulationEngine } from './utils/SimulationEngine'

const nodeTypes = {
  probabilityNode: CustomNode,
}

const initialNodes: Node[] = [
  {
    id: '1',
    type: 'probabilityNode',
    position: { x: 250, y: 100 },
    data: { 
      label: 'Start Node',
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
      outputs: [
        { id: 'out3', label: 'Great Success', probability: 0.8 },
        { id: 'out4', label: 'Minor Success', probability: 0.2 }
      ]
    },
  },
  {
    id: '3',
    type: 'probabilityNode',
    position: { x: 500, y: 200 },
    data: { 
      label: 'Failure Recovery',
      outputs: [
        { id: 'out5', label: 'Recovered', probability: 0.4 },
        { id: 'out6', label: 'Total Failure', probability: 0.6 }
      ]
    },
  },
]

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
]

function App() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)
  const [isSimulating, setIsSimulating] = useState(false)
  const [simulationResults, setSimulationResults] = useState<SimulationResults | null>(null)

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  )

  const runSimulation = useCallback(() => {
    setIsSimulating(true)
    
    // Use the new simulation engine
    setTimeout(() => {
      const simulationEngine = new SimulationEngine(nodes, edges)
      const results = simulationEngine.runSimulation(10000)
      setSimulationResults(results)
      setIsSimulating(false)
    }, 500)
  }, [nodes, edges])

  const addNewNode = useCallback(() => {
    const newNode: Node = {
      id: `node-${Date.now()}`,
      type: 'probabilityNode',
      position: { x: Math.random() * 400 + 100, y: Math.random() * 300 + 100 },
      data: {
        label: `Node ${nodes.length + 1}`,
        outputs: [
          { id: `out-${Date.now()}`, label: 'Output', probability: 0.5 }
        ]
      }
    }
    setNodes((nds) => [...nds, newNode])
  }, [nodes.length, setNodes])

  return (
    <div className="app">
      <div className="flow-container">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          fitView
        >
          <Controls />
          <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
        </ReactFlow>
      </div>
      <Sidebar 
        onRunSimulation={runSimulation}
        onAddNode={addNewNode}
        isSimulating={isSimulating}
        simulationResults={simulationResults}
      />
    </div>
  )
}

export default App
