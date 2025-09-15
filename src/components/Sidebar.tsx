import type { SimulationResults } from '../types/NodeTypes'
import './Sidebar.css'

interface SidebarProps {
  onRunSimulation: () => void
  onAddNode: () => void
  isSimulating: boolean
  simulationResults: SimulationResults | null
}

function Sidebar({ onRunSimulation, onAddNode, isSimulating, simulationResults }: SidebarProps) {
  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <h2>StatXplor</h2>
        <p>Node-based probability explorer</p>
      </div>

      <div className="sidebar-section">
        <h3>Tools</h3>
        <button 
          className="btn btn-primary"
          onClick={onAddNode}
        >
          Add Node
        </button>
        
        <button 
          className={`btn ${isSimulating ? 'btn-disabled' : 'btn-success'}`}
          onClick={onRunSimulation}
          disabled={isSimulating}
        >
          {isSimulating ? 'Simulating...' : '▶ Run Simulation'}
        </button>
      </div>

      {simulationResults && (
        <div className="sidebar-section">
          <h3>Results</h3>
          <div className="results-container">
            <div className="result-summary">
              <strong>Total Simulations: {simulationResults.totalPaths.toLocaleString()}</strong>
            </div>
            
            <div className="outcomes">
              {simulationResults.outcomes.map((outcome, index) => (
                <div key={index} className="outcome-item">
                  <div className="outcome-label">{outcome.label}</div>
                  <div className="outcome-stats">
                    <span className="probability">{(outcome.probability * 100).toFixed(1)}%</span>
                    <span className="count">({outcome.count.toLocaleString()} runs)</span>
                  </div>
                  <div 
                    className="probability-bar"
                    style={{ width: `${outcome.probability * 100}%` }}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="sidebar-section">
        <h3>Instructions</h3>
        <ul className="instructions">
          <li>Add nodes to create probability chains</li>
          <li>Connect outputs to inputs to build paths</li>
          <li>Each node can have multiple outputs with probabilities</li>
          <li>Use numbers (0-1), functions, or lookup tables for probabilities</li>
          <li>Click "Run Simulation" to calculate results</li>
        </ul>
      </div>
    </div>
  )
}

export default Sidebar