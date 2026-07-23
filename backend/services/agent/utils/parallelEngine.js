/**
 * Evaluates and runs a dependency graph (DAG) of nodes.
 * Executes independent nodes in parallel and suspends execution if nodes have unmet dependencies.
 * Includes cancellation capabilities.
 * 
 * @param {Array} nodes 
 * @param {Array} edges 
 * @param {Function} executeNodeFn (node, parentOutputs) => Promise<any>
 * @param {Object} context { aborted: boolean, error?: string }
 * @returns {Promise<Object>} Map of node outputs (nodeId -> output)
 */
export async function executeDependencyGraph(nodes, edges, executeNodeFn, context = {}) {
  const nodeMap = new Map(nodes.map(n => [n.id, n]));
  const adjacencyList = new Map(); // parent -> [children]
  const incomingEdgesCount = new Map(); // child -> parent count
  
  // Initialize
  for (const node of nodes) {
    adjacencyList.set(node.id, []);
    incomingEdgesCount.set(node.id, 0);
  }
  
  // Build graph
  for (const edge of edges) {
    const parentList = adjacencyList.get(edge.source);
    if (parentList) parentList.push(edge.target);
    incomingEdgesCount.set(edge.target, (incomingEdgesCount.get(edge.target) || 0) + 1);
  }
  
  // Track completed nodes and outputs
  const completed = new Set();
  const outputs = context.outputs || {};
  
  // Helper to execute a node and recursively trigger children
  async function runNode(nodeId) {
    if (context.aborted) return;
    
    // If already executed (for resumption), skip but trigger children
    if (outputs[nodeId]) {
      completed.add(nodeId);
      const children = adjacencyList.get(nodeId) || [];
      const executionPromises = [];
      for (const childId of children) {
        incomingEdgesCount.set(childId, incomingEdgesCount.get(childId) - 1);
        if (incomingEdgesCount.get(childId) === 0) {
          executionPromises.push(runNode(childId));
        }
      }
      await Promise.all(executionPromises);
      return;
    }

    const node = nodeMap.get(nodeId);
    try {
      // Execute the node function
      const output = await executeNodeFn(node, outputs);
      
      // If node indicates suspension/waiting for approval
      if (output && output.status === "WAITING_FOR_APPROVAL") {
        context.suspendedNodeId = nodeId;
        context.suspended = true;
        return;
      }

      outputs[nodeId] = output;
      completed.add(nodeId);
      
      // Find children that are now ready to execute
      const children = adjacencyList.get(nodeId) || [];
      const executionPromises = [];
      
      for (const childId of children) {
        incomingEdgesCount.set(childId, incomingEdgesCount.get(childId) - 1);
        if (incomingEdgesCount.get(childId) === 0) {
          executionPromises.push(runNode(childId));
        }
      }
      
      await Promise.all(executionPromises);
    } catch (error) {
      context.error = error.message;
      context.aborted = true;
      throw error;
    }
  }
  
  // Find start nodes
  const startNodes = nodes.filter(node => incomingEdgesCount.get(node.id) === 0);
  if (startNodes.length === 0 && nodes.length > 0) {
    throw new Error("Loop detected in dependency graph");
  }
  
  // Run starting nodes in parallel
  await Promise.all(startNodes.map(node => runNode(node.id)));
  
  // If execution was suspended for human approval, return the intermediate outputs
  if (context.suspended) {
    return { outputs, suspended: true, suspendedNodeId: context.suspendedNodeId };
  }

  if (completed.size !== nodes.length && !context.aborted) {
    throw new Error("Workflow graph did not complete fully, check for cycles or disconnected nodes.");
  }
  
  return { outputs, completed: true };
}
