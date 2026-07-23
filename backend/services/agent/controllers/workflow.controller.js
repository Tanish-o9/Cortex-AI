import { Workflow, WorkflowExecution } from "../models/workflow.model.js";
import { executeWorkflow } from "../utils/workflowEngine.js";

// Save a new workflow configuration
export async function createWorkflow(req, res) {
  const { name, description, nodes, edges } = req.body;
  const userId = req.headers["x-user-id"] || "guest";
  
  try {
    const workflow = await Workflow.create({
      name,
      description,
      nodes,
      edges,
      userId
    });
    res.status(201).json({ success: true, workflow });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

// List all workflows
export async function listWorkflows(req, res) {
  const userId = req.headers["x-user-id"] || "guest";
  try {
    const workflows = await Workflow.find({ userId });
    res.status(200).json({ success: true, workflows });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

// Get single workflow
export async function getWorkflow(req, res) {
  try {
    const workflow = await Workflow.findById(req.params.id);
    if (!workflow) {
      return res.status(404).json({ success: false, message: "Workflow not found" });
    }
    res.status(200).json({ success: true, workflow });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

// Trigger workflow execution
export async function runWorkflow(req, res) {
  const userId = req.headers["x-user-id"] || "guest";
  try {
    const workflow = await Workflow.findById(req.params.id);
    if (!workflow) {
      return res.status(404).json({ success: false, message: "Workflow not found" });
    }

    // Create execution log entry
    const execution = await WorkflowExecution.create({
      workflowId: workflow._id,
      userId,
      status: "RUNNING"
    });

    // Run the engine
    const runResult = await executeWorkflow(workflow, userId);

    if (runResult.suspended) {
      execution.status = "WAITING_FOR_APPROVAL";
      execution.currentNodeId = runResult.suspendedNodeId;
      execution.nodeOutputs = runResult.outputs;
      await execution.save();
      return res.status(202).json({
        success: true,
        message: "Workflow execution suspended, waiting for human approval.",
        executionId: execution._id,
        suspendedNodeId: runResult.suspendedNodeId
      });
    }

    execution.status = "COMPLETED";
    execution.nodeOutputs = runResult.outputs;
    await execution.save();

    res.status(200).json({ success: true, executionId: execution._id, outputs: runResult.outputs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

// Resume a suspended execution (Approval)
export async function resumeWorkflow(req, res) {
  const { executionId, approve } = req.body;
  
  try {
    const execution = await WorkflowExecution.findById(executionId);
    if (!execution) {
      return res.status(404).json({ success: false, message: "Execution record not found" });
    }

    if (execution.status !== "WAITING_FOR_APPROVAL") {
      return res.status(400).json({ success: false, message: "Execution is not in WAITING_FOR_APPROVAL status" });
    }

    if (!approve) {
      execution.status = "FAILED";
      execution.error = "Rejected by human approval";
      await execution.save();
      return res.status(200).json({ success: true, message: "Workflow rejected." });
    }

    const workflow = await Workflow.findById(execution.workflowId);
    
    // Mark the suspended node as approved in execution cache and run engine from there
    execution.status = "RUNNING";
    await execution.save();

    // Mark the node as resolved
    const currentOutputs = Object.fromEntries(execution.nodeOutputs);
    currentOutputs[execution.currentNodeId] = { approved: true, timestamp: Date.now() };
    execution.nodeOutputs = currentOutputs;

    const runResult = await executeWorkflow(workflow, execution.userId, execution);

    if (runResult.suspended) {
      execution.status = "WAITING_FOR_APPROVAL";
      execution.currentNodeId = runResult.suspendedNodeId;
      execution.nodeOutputs = runResult.outputs;
      await execution.save();
      return res.status(202).json({
        success: true,
        message: "Workflow execution suspended again on another approval block.",
        executionId: execution._id
      });
    }

    execution.status = "COMPLETED";
    execution.nodeOutputs = runResult.outputs;
    await execution.save();

    res.status(200).json({ success: true, message: "Workflow resumed and completed.", outputs: runResult.outputs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

// Fetch pending approvals list
export async function getPendingApprovals(req, res) {
  try {
    const approvals = await WorkflowExecution.find({ status: "WAITING_FOR_APPROVAL" }).populate("workflowId");
    res.status(200).json({ success: true, approvals });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}
export async function deleteWorkflow(req, res) {
  try {
    await Workflow.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: "Workflow deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}
