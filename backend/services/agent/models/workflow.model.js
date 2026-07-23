import mongoose from "mongoose";

const workflowSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  nodes: { type: Array, required: true }, // [{ id, type, data: { label, prompt, tools, model, key, url, condition, limit } }]
  edges: { type: Array, required: true }, // [{ id, source, target }]
  version: { type: Number, default: 1 },
  userId: { type: String, required: true },
  organizationId: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const workflowExecutionSchema = new mongoose.Schema({
  workflowId: { type: mongoose.Schema.Types.ObjectId, ref: "Workflow", required: true },
  userId: { type: String, required: true },
  status: { type: String, enum: ["RUNNING", "COMPLETED", "FAILED", "WAITING_FOR_APPROVAL"], default: "RUNNING" },
  currentNodeId: { type: String },
  nodeOutputs: { type: Map, of: mongoose.Schema.Types.Mixed, default: {} }, // key: nodeId, value: JSON outputs
  error: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

export const Workflow = mongoose.model("Workflow", workflowSchema);
export const WorkflowExecution = mongoose.model("WorkflowExecution", workflowExecutionSchema);
