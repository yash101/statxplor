import { Handle, Position } from 'reactflow'
import type { NodeOutput } from '../types/NodeTypes'

interface CustomNodeProps {
  data: {
    label: string
    outputs: NodeOutput[]
  }
}

function CustomNode({ data }: CustomNodeProps) {
  return (
    <div className="custom-node">
      <Handle
        type="target"
        position={Position.Left}
        style={{ background: '#4CAF50' }}
      />
      
      <h3>{data.label}</h3>
      
      <div className="node-outputs">
        {data.outputs.map((output, index) => (
          <div key={output.id} className="output-item">
            <span>{output.label}</span>
            <span className="output-probability">
              {typeof output.probability === 'number' 
                ? (output.probability * 100).toFixed(1) + '%'
                : output.probability
              }
            </span>
            <Handle
              type="source"
              position={Position.Right}
              id={output.id}
              style={{ 
                background: '#FF9800',
                top: `${50 + (index - (data.outputs.length - 1) / 2) * 30}%`
              }}
            />
          </div>
        ))}
      </div>
    </div>
  )
}

export default CustomNode