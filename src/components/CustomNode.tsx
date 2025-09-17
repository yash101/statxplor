import { Handle, Position } from 'reactflow'
import type { NodeOutput } from '../types/NodeTypes'

export interface CustomNodeProps {
  data: {
    label: string
    outputs: NodeOutput[]
    error: number | null
  }
}

function CustomNode({ data }: CustomNodeProps) {
  return (
    <div className='custom-node'>
      <Handle
        type='target'
        position={Position.Left}
        style={{ background: '#4CAF50', left: -6 }}
      />
      
      <h3>{data.label}</h3>
      
      <div className='node-outputs'>
        {data.outputs.map((output) => (
          <div
            key={output.id}
            className='output-item relative flex items-center gap-8 bg-gray-100'
          >
          <span>{output.label}</span>
          <span
            className='output-probability'
            style={{ whiteSpace: 'nowrap' }}
          >
            {output.probability}
          </span>
          <Handle
            type='source'
            position={Position.Right}
            id={output.id}
            style={{
              background: '#FF9800',
              position: 'absolute',
              right: -23,
              top: '50%',
              transform: 'translateY(-50%)',
            }}
          />
          </div>
        ))}
          <div className='output-item relative flex items-center gap-8 bg-red-200'>
            <span>Uncertainty</span>
            <span
              className='output-probability'
              style={{ whiteSpace: 'nowrap' }}
            >
              {data?.error || 'None'}
            </span>
          </div>
      </div>
    </div>
  )
}

export default CustomNode
