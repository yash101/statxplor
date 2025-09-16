import type { SimulationResults, ProbabilityNode } from '../types/NodeTypes'
import type { Node } from 'reactflow'
import { ExpandIcon, HelpCircleIcon, PlayIcon, PlusCircleIcon } from 'lucide-react'
import './Sidebar.css'
import usePopup from './Popup/usePopup'
import { HelpDialog } from './dialog/HelpDialog'
import { Tagline } from '../utils/tagline'
import NodeConfigPane from './NodeConfigPane'

interface SidebarProps {
  onRunSimulation: () => void
  onAddNode: () => void
  isSimulating: boolean
  simulationResults: SimulationResults | null
  selectedNode: Node<ProbabilityNode> | null
  onSaveNode: (nodeId: string, updated: ProbabilityNode) => void
}

function Sidebar({
  onRunSimulation,
  onAddNode,
  isSimulating,
  simulationResults,
  selectedNode,
  onSaveNode
}: SidebarProps) {
  const popup = usePopup();

  return (
    <div className='sidebar flex-col'>
      <div className='sidebar-header'>
        <h2>StatXplor</h2>
        <p>Node-based probability explorer using monte-carlo simulation</p>
        <br />
        <Tagline />
        <button
          onClick={(e) => {
            e.preventDefault()
            popup.show(<HelpDialog />)
          }}
          className="btn btn-secondary bg-gray-200 hover:bg-gray-300"
          aria-label="Open help dialog"
        >
          <div className='flex items-center gap-2'>
            <HelpCircleIcon />
            <span>Help & Instructions</span>
          </div>
        </button>
      </div>

  <div className='sidebar-section'>
        <h3>Tools</h3>
        <button
          className='btn btn-primary'
          onClick={onAddNode}
        >
          <div className='flex items-center gap-2'>
            <PlusCircleIcon />
            <span>Add Node</span>
          </div>
        </button>
        
        <button
          className={`btn ${isSimulating ? 'btn-disabled' : 'btn-success'}`}
          onClick={onRunSimulation}
          disabled={isSimulating}
        >
          <div className='flex items-center gap-2'>
            <PlayIcon />
            <span>{isSimulating ? 'Simulating...' : 'Run Simulation'}</span>
          </div>
        </button>

        {selectedNode && (
          <div className='mt-4 border-t pt-4'>
            <h3 className='mb-2'>Node Configuration</h3>
            {/* Lazy import to avoid circular dependency; direct import at top would also work */}
            {/** @ts-ignore dynamic require fallback **/}
            { (() => {
              return <NodeConfigPane node={selectedNode} onSave={onSaveNode} />
            })() }
          </div>
        )}
      </div>

      {simulationResults && (
        <div className='sidebar-section'>
          <h3>Results</h3>
          <button
            className='btn btn-primary w-full'
            onClick={() => {
              popup.show(<p>Results</p>);
            }}
          >
            <div className='flex items-center gap-2'>
              <ExpandIcon />
              <span>Open Results</span>
            </div>
          </button>
          <div className='results-container'>
            <div className='result-summary'>
              <strong>Total Simulations: {simulationResults.totalPaths.toLocaleString()}</strong>
            </div>
            
            <div className='outcomes'>
              {simulationResults.outcomes.map((outcome, index) => (
                <div key={index} className='outcome-item'>
                  <div className='outcome-label'>{outcome.label}</div>
                  <div className='outcome-stats'>
                    <span className='probability'>{(outcome.probability * 100).toFixed(1)}%</span>
                    <span className='count'>({outcome.count.toLocaleString()} runs)</span>
                  </div>
                  <div 
                    className='probability-bar'
                    style={{ width: `${outcome.probability * 100}%` }}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Sidebar