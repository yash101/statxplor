import type { Node, Edge } from 'reactflow'
import type { NodeOutput, SimulationResults, SimulationResult } from '../types/NodeTypes'

export class SimulationEngine {
  private nodes: Node[]
  private edges: Edge[]

  constructor(nodes: Node[], edges: Edge[]) {
    this.nodes = nodes
    this.edges = edges
  }

  // Run Monte Carlo simulation
  runSimulation(iterations: number = 10000): SimulationResults {
    const pathCounts = new Map<string, number>()
    
    for (let i = 0; i < iterations; i++) {
      const path = this.simulateSingleRun()
      const pathKey = path.join(' → ')
      pathCounts.set(pathKey, (pathCounts.get(pathKey) || 0) + 1)
    }

    // Convert results to the expected format
    const outcomes: SimulationResult[] = Array.from(pathCounts.entries()).map(([path, count]) => ({
      label: path || 'No path',
      probability: count / iterations,
      count
    })).sort((a, b) => b.count - a.count)

    return {
      totalPaths: iterations,
      outcomes
    }
  }

  private simulateSingleRun(): string[] {
    const path: string[] = []
    
    // Find starting nodes (nodes with no incoming edges)
    const startingNodes = this.nodes.filter(node => 
      !this.edges.some(edge => edge.target === node.id)
    )

    if (startingNodes.length === 0) {
      return ['No starting node found']
    }

    let currentNode: Node | null = startingNodes[0] // Start from first starting node
    path.push(currentNode.data.label)

    // Follow the probability chain
    while (currentNode) {
      const nextNode = this.getNextNode(currentNode)
      if (nextNode && nextNode.nodeId) {
        path.push(nextNode.label)
        const foundNode = this.nodes.find(n => n.id === nextNode.nodeId)
        currentNode = foundNode || null
      } else if (nextNode) {
        path.push(nextNode.label)
        break
      } else {
        break
      }
    }

    return path
  }

  private getNextNode(currentNode: Node): { nodeId: string; label: string } | null {
    const nodeOutputs = currentNode.data.outputs as NodeOutput[]
    
    if (!nodeOutputs || nodeOutputs.length === 0) {
      return null
    }

    // Find which output to follow based on probabilities
    const selectedOutput = this.selectOutputByProbability(nodeOutputs)
    if (!selectedOutput) {
      return null
    }

    // Find the edge connected to this output
    const connectedEdge = this.edges.find(edge => 
      edge.source === currentNode.id && edge.sourceHandle === selectedOutput.id
    )

    if (!connectedEdge) {
      return { nodeId: '', label: selectedOutput.label }
    }

    // Find the target node
    const targetNode = this.nodes.find(n => n.id === connectedEdge.target)
    if (!targetNode) {
      return { nodeId: '', label: selectedOutput.label }
    }

    return { 
      nodeId: targetNode.id, 
      label: selectedOutput.label 
    }
  }

  private selectOutputByProbability(outputs: NodeOutput[]): NodeOutput | null {
    // Normalize probabilities to ensure they sum to 1
    const totalProb = outputs.reduce((sum, output) => {
      const prob = this.evaluateProbability(output.probability)
      return sum + prob
    }, 0)

    if (totalProb === 0) {
      return outputs[0] || null
    }

    // Generate random number between 0 and totalProb
    const random = Math.random() * totalProb
    let cumulative = 0

    for (const output of outputs) {
      const prob = this.evaluateProbability(output.probability)
      cumulative += prob
      if (random <= cumulative) {
        return output
      }
    }

    return outputs[outputs.length - 1] || null
  }

  private evaluateProbability(probability: number | string): number {
    if (typeof probability === 'number') {
      return Math.max(0, Math.min(1, probability))
    }

    // Handle string-based probabilities (functions, LUTs, etc.)
    if (typeof probability === 'string') {
      try {
        // Simple function evaluation (could be enhanced)
        if (probability.includes('Math.') || probability.includes('random')) {
          const result = eval(probability)
          return Math.max(0, Math.min(1, Number(result) || 0))
        }

        // Try to parse as number
        const parsed = parseFloat(probability)
        if (!isNaN(parsed)) {
          return Math.max(0, Math.min(1, parsed))
        }
      } catch (error) {
        console.warn('Error evaluating probability:', probability, error)
      }
    }

    return 0.5 // Default fallback
  }
}