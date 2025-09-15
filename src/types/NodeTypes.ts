export interface NodeOutput {
  id: string
  label: string
  probability: number | string // Can be a number, function string, or LUT reference
}

export interface ProbabilityNode {
  id: string
  label: string
  outputs: NodeOutput[]
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