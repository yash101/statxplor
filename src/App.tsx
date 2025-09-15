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
import 'reactflow/dist/style.css'
import './App.css'
import Sidebar from './components/Sidebar'
import CustomNode from './components/CustomNode'

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
]

const initialEdges: Edge[] = []

function App() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)
  const [isSimulating, setIsSimulating] = useState(false)
  const [simulationResults, setSimulationResults] = useState<any>(null)

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  )

  const runSimulation = useCallback(() => {
    setIsSimulating(true)
    // Simulate processing
    setTimeout(() => {
      const results = {
        totalPaths: 1000,
        outcomes: [
          { label: 'Success Path', probability: 0.7, count: 700 },
          { label: 'Failure Path', probability: 0.3, count: 300 }
        ]
      }
      setSimulationResults(results)
      setIsSimulating(false)
    }, 1000)
  }, [])

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
