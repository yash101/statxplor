export type ProbabilityKind = 'numeric' | 'equation' | 'function'

export interface NodeOutput {
  id: string
  label: string
  probability: number | string // Base numeric weight or raw string (legacy)
  kind?: ProbabilityKind // How to interpret the probability
  equation?: string // mathjs expression when kind === 'equation'
  fnBody?: string // JS function body when kind === 'function'
}

export interface ProbabilityNode {
  id: string
  label: string
  outputs: NodeOutput[]
  error_term: number // Optional uncertainty metadata
}

export interface SimulationResult {
  label: string
  probability: number
  count: number
}

export interface SimulationResults {
  totalPaths: number
  outcomes: SimulationResult[]
}
