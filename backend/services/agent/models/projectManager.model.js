import mongoose from "mongoose";

const kanbanTaskSchema = new mongoose.Schema({
  id: { type: String, required: true },
  title: { type: String, required: true },
  description: { type: String },
  assignee: { type: String, default: "SearchAgent" }, // SearchAgent, CodingAgent, User
  priority: { type: String, enum: ["Low", "Medium", "High"], default: "Medium" },
  dependsOn: { type: [String], default: [] },
  status: { type: String, enum: ["todo", "in_progress", "review", "done"], default: "todo" }
});

const sprintSchema = new mongoose.Schema({
  name: { type: String, required: true },
  goalId: { type: String }, // Optional link to autonomous goal
  userId: { type: String, required: true },
  tasks: [kanbanTaskSchema],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

export const Sprint = mongoose.model("Sprint", sprintSchema);
