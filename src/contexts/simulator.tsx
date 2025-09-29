import React, { createContext, useContext, useMemo, useRef, useEffect } from 'react'
import { SimulationEngineV2 } from '../utils/simulation.v2'

const SimulatorContext = createContext<SimulationEngineV2 | null>(null)

export function SimulatorProvider({ children }: { children: React.ReactNode }) {
  const instanceRef = useRef<SimulationEngineV2 | null>(null)
  const engine = useMemo(() => {
    if (!instanceRef.current) instanceRef.current = new SimulationEngineV2()
    return instanceRef.current
  }, [])

  useEffect(() => {
    return () => {
      if (instanceRef.current) {
        try {
          // dispose may not exist on older versions
          if (typeof (instanceRef.current as any).dispose === 'function') (instanceRef.current as any).dispose()
        } catch {}
        instanceRef.current = null
      }
    }
  }, [])

  return <SimulatorContext.Provider value={engine}>{children}</SimulatorContext.Provider>
}

export function useSimulator(): SimulationEngineV2 {
  const ctx = useContext(SimulatorContext)
  if (!ctx)
    throw new Error('useSimulator must be used within a SimulatorProvider')
  return ctx
}
