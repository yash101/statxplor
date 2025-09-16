import { useState } from 'react'
import type { Node } from 'reactflow'
import type { NodeOutput, ProbabilityNode, ProbabilityKind } from '../types/NodeTypes'
import usePopup from './Popup/usePopup'
import FunctionEditor from './FunctionEditor'

interface Props {
  node: Node<ProbabilityNode>
  onSave: (nodeId: string, updated: ProbabilityNode) => void
}

export const NodeConfigPane = ({ node, onSave }: Props) => {
  const popup = usePopup()
  const [draft, setDraft] = useState<ProbabilityNode>(() => ({
    id: node.id,
    label: node.data.label,
    outputs: node.data.outputs.map(o => ({ ...o })),
    error: (node.data as ProbabilityNode).error
  }))

  const updateOutput = (index: number, patch: Partial<NodeOutput>) => {
    setDraft(d => {
      const outputs = d.outputs.slice()
      outputs[index] = { ...outputs[index], ...patch }
      return { ...d, outputs }
    })
  }

  const addOutput = () => {
    setDraft(d => ({
      ...d,
      outputs: [...d.outputs, { id: `out-${Date.now()}`, label: 'Option', probability: 1, kind: 'numeric' }]
    }))
  }

  const removeOutput = (i: number) => {
    setDraft(d => ({ ...d, outputs: d.outputs.filter((_, idx) => idx !== i) }))
  }

  const editFunction = (i: number) => {
    const current = draft.outputs[i]
    const currentPopup = popup.show(
      <div className='w-[80vw] h-[80vh] flex flex-col'>
        <h2 className='text-lg font-semibold mb-2'>Edit Function for {current.label}</h2>
        <FunctionEditor
          initialCode={current.fnBody || ''}
          onCancel={() => popup.close}
          onSave={(code) => {
            updateOutput(i, { fnBody: code, kind: 'function' });
            currentPopup.close();
          }}
        />
      </div>
    )
  }

  const changeKind = (i: number, kind: ProbabilityKind) => {
    if (kind === 'numeric') updateOutput(i, { kind })
    if (kind === 'equation') updateOutput(i, { kind, equation: draft.outputs[i].equation || '' })
    if (kind === 'function') editFunction(i)
  }

  const saveDraft = () => {
    // ensure numeric parsing
    const cleaned: ProbabilityNode = {
      ...draft,
      outputs: draft.outputs.map(o => ({
        ...o,
        probability: typeof o.probability === 'string' && o.kind === 'numeric' ? parseFloat(o.probability) : o.probability
      }))
    }
    onSave(node.id, cleaned)
  }

  return (
    <div className='flex flex-col gap-4'>
      <div>
        <label className='block text-xs font-semibold mb-1'>Node Name</label>
        <input
          className='w-full border rounded px-2 py-1 text-sm'
          value={draft.label}
          onChange={e => setDraft(d => ({ ...d, label: e.target.value }))}
        />
      </div>
      <div>
        <label className='block text-xs font-semibold mb-1'>Error / Uncertainty</label>
        <input
          type='number'
          className='w-full border rounded px-2 py-1 text-sm'
          value={draft.error ?? ''}
          onChange={e => setDraft(d => ({ ...d, error: e.target.value === '' ? undefined : Number(e.target.value) }))}
        />
      </div>
      <div className='flex items-center justify-between'>
        <h4 className='font-semibold text-sm'>Probabilities</h4>
        <button className='text-xs px-2 py-1 border rounded' onClick={addOutput}>Add</button>
      </div>
      <div className='flex flex-col gap-3'>
        {draft.outputs.map((o, i) => (
          <div key={o.id} className='border rounded p-2 flex flex-col gap-2 bg-white'>
            <div className='flex items-center gap-2'>
              <input
                className='flex-1 border rounded px-2 py-1 text-sm'
                value={o.label}
                onChange={e => updateOutput(i, { label: e.target.value })}
              />
              <button className='text-[11px] text-red-600' onClick={() => removeOutput(i)}>Remove</button>
            </div>
            <div className='flex items-center gap-2 flex-wrap'>
              <label className='text-xs font-medium'>Value</label>
              <input
                type='number'
                className='w-24 border rounded px-2 py-1 text-sm'
                value={typeof o.probability === 'number' ? o.probability : parseFloat(o.probability) || ''}
                onChange={e => updateOutput(i, { probability: Number(e.target.value) })}
                disabled={o.kind === 'equation' || o.kind === 'function'}
              />
              <div className='flex items-center gap-2 text-xs'>
                <span className='font-medium ml-2'>Type:</span>
                {(['numeric', 'equation', 'function'] as ProbabilityKind[]).map(k => (
                  <label key={k} className='inline-flex items-center gap-1 cursor-pointer'>
                    <input
                      type='radio'
                      name={`prob-kind-${o.id}`}
                      checked={(o.kind || 'numeric') === k}
                      onChange={() => changeKind(i, k)}
                    />
                    {k}
                  </label>
                ))}
              </div>
            </div>
            {o.kind === 'equation' && (
              <input
                className='w-full border rounded px-2 py-1 text-xs font-mono'
                placeholder='mathjs expression, e.g. 2 * (3 + 4)'
                value={o.equation || ''}
                onChange={e => updateOutput(i, { equation: e.target.value })}
              />
            )}
            {o.kind === 'function' && (
              <div className='text-xs text-gray-600 font-mono truncate'>
                {o.fnBody ? o.fnBody.slice(0, 120) : 'No function body set'}
                <button className='ml-2 underline' onClick={() => editFunction(i)}>Edit</button>
              </div>
            )}
          </div>
        ))}
      </div>
      <div className='flex justify-end gap-2 pt-2'>
        <button
          className='px-3 py-1 text-sm border rounded bg-red-500 text-white'
          onClick={() => {
            alert('TBD. Just use backspace for now.');
          }}
        >
          Delete Node
        </button>
        <button
          className='px-3 py-1 text-sm border rounded'
          onClick={() => setDraft({
            id: node.id,
            label: node.data.label,
            outputs: node.data.outputs.map(o => ({ ...o })),
            error: (node.data as ProbabilityNode).error
          })}
        >
          Reset
        </button>
        <button className='px-3 py-1 text-sm bg-blue-600 text-white rounded' onClick={saveDraft}>Save</button>
      </div>
    </div>
  )
}

export default NodeConfigPane