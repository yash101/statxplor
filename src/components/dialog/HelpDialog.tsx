export const HelpDialog = () => {
  return (
    <div className="help-dialog prose">
      <h1>Help & Welcome</h1>

      <p>
        StatXplor is a node-based probability explorer that uses Monte Carlo simulation
        to estimate outcome probabilities from connected nodes. Use this guide to get
        started fast.
      </p>

      <h2>Getting started</h2>
      <ol>
        <li><strong>Add nodes</strong> — Click <em>Add Node</em> in the sidebar to create a new node.</li>
        <li><strong>Configure outputs</strong> — Each node can have one or more outputs. For each output set a label and a probability (see formats below).</li>
        <li><strong>Connect nodes</strong> — Wire an output of one node to the input of another to build paths.</li>
        <li><strong>Run simulation</strong> — Click <em>Run Simulation</em> to run many random trials and estimate outcome frequencies.</li>
        <li><strong>Inspect results</strong> — When the run finishes, review the outcomes and their probabilities in the results panel.</li>
      </ol>

      <h2>Probability input formats</h2>
      <ul>
        <li><strong>Number</strong> — A decimal between 0 and 1 (e.g. 0.25 for 25%).</li>
        <li><strong>Function</strong> — A JavaScript expression that returns a number in [0,1] (advanced).</li>
        <li><strong>Lookup / table</strong> — Provide a small table or mapping for conditional probabilities (see examples in node editor).</li>
      </ul>

      <h2>Running & reading results</h2>
      <ul>
        <li>The simulator runs many randomized trials (Monte Carlo) and counts how often each labeled outcome occurs.</li>
        <li>Results show a probability percent and the raw number of runs that produced that outcome.</li>
        <li>If a node chain has cycles, the simulator will follow configured limits—break cycles by design or use absorbing end nodes.</li>
      </ul>

      <h2>Tips & troubleshooting</h2>
      <ul>
        <li>Make sure probabilities from a single node's outputs sum to 1 (or normalize them intentionally).</li>
        <li>Start small: build a short chain and verify expected behavior before scaling to many nodes.</li>
        <li>Use descriptive labels for outputs so results are easy to interpret.</li>
        <li>If results look unexpected, inspect node connections and probability values for typos or incorrect functions.</li>
      </ul>

      <h2>Next steps</h2>
      <p>
        Add a few nodes, connect them, then run the simulation. If you'd like, open the popup examples from the sidebar to see sample node configurations.
      </p>
    </div>
  )
};
