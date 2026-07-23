import mongoose from "mongoose";

const graphNodeSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  label: { type: String, required: true }, // e.g. "React", "User1", "Task_1"
  type: { type: String, required: true }, // e.g. "Concept", "User", "Task"
  properties: { type: Map, of: mongoose.Schema.Types.Mixed, default: {} }
});

const graphEdgeSchema = new mongoose.Schema({
  source: { type: String, required: true }, // Node ID
  target: { type: String, required: true }, // Node ID
  relationship: { type: String, required: true }, // e.g. "BlockedBy", "InterestedIn", "PartOf"
  properties: { type: Map, of: mongoose.Schema.Types.Mixed, default: {} }
});

export const GraphNode = mongoose.model("GraphNode", graphNodeSchema);
export const GraphEdge = mongoose.model("GraphEdge", graphEdgeSchema);
