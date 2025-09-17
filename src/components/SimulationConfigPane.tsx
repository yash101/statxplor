import { useState } from 'react'
import { PlayIcon } from 'lucide-react'

interface SimulationConfigPaneProps {
  onRunSimulation: () => void
  isSimulating: boolean
}

export default function SimulationConfigPane({ onRunSimulation, isSimulating }: SimulationConfigPaneProps) {
  const [variableSweepEnabled, setVariableSweepEnabled] = useState<boolean>(false)

  return (
    <div className='sidebar-section'>
      <h3>Simulation Setup</h3>
      <div className="variable-form border rounded p-3 mb-4">
        <div className='flex justify-between'>
          <h4>Variable Sweep</h4>
          <div>
            <form onSubmit={(e) => e.preventDefault()}>
              <label className='flex flex-row gap-2'>
                <input
                  type="checkbox"
                  name="variableEnable"
                  aria-label="Enable variable sweep"
                  className="form-checkbox w-[1rem] h-[1rem] my-1"
                  checked={variableSweepEnabled}
                  onChange={(e) => setVariableSweepEnabled(e.target.checked)}
                />
                <span>Enable</span>
              </label>
            </form>
          </div>
        </div>

        <form
          className={[
            'flex',
            'flex-col',
            'gap-3',
          ].join(' ')}
          onSubmit={(e) => e.preventDefault()}
        >
          <div
            className={[
              'grid',
              'grid-cols-1',
              'gap-2',
              'sm:grid-cols-2',
              variableSweepEnabled ? '' : 'hidden',
            ].join(' ')}
          >
            <label className="flex flex-col">
              <span className="text-sm mb-1">Variable Name</span>
              <input
                type="text"
                name="variableName"
                placeholder="e.g. x"
                className="input px-2 py-1 border rounded"
                aria-label="Variable name"
                defaultValue={'x'}
              />
            </label>

            <label className="flex flex-col">
              <span className="text-sm mb-1">Number of Steps</span>
              <input
                type="number"
                name="numSteps"
                className="input px-2 py-1 border rounded"
                min={1}
                step={1}
                defaultValue={10}
                aria-label="Number of steps"
              />
            </label>

            <label className="flex flex-col">
              <span className="text-sm mb-1">Start Value</span>
              <input
                type="number"
                name="startValue"
                className="input px-2 py-1 border rounded"
                aria-label="Start value"
                defaultValue={0}
              />
            </label>

            <label className="flex flex-col">
              <span className="text-sm mb-1">End Value</span>
              <input
                type="number"
                name="endValue"
                className="input px-2 py-1 border rounded"
                aria-label="End value"
                defaultValue={1}
              />
            </label>
          </div>

          <hr className={variableSweepEnabled ? '' : 'hidden'} />

          <label className="flex flex-col mt-2">
            <span className="text-sm mb-1"># iterations{variableSweepEnabled ? ' per step' : ''}</span>
            <input
              type="number"
              name="endValue"
              defaultValue={10000}
              min={1}
              step={1}
              placeholder='e.g. 10000'
              className="input px-2 py-1 border rounded"
              aria-label="Iterations per Step"
            />
          </label>


          <label className="flex flex-col mt-2">
            <span className="text-sm mb-1"># Max nodes explored per iteration</span>
            <span>0 = infinite. May cause infinite loops and nonconvergence.</span>
            <input
              type="number"
              name="endValue"
              defaultValue={200}
              min={0}
              step={1}
              placeholder='e.g. 200'
              className="input px-2 py-1 border rounded"
              aria-label="Max expansion depth"
            />
          </label>

        </form>
      </div>
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
    </div>
  )
}
