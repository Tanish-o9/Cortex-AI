import mongoose from "mongoose";

const subtaskSchema = new mongoose.Schema({
  id: { type: String, required: true },
  title: { type: String, required: true },
  description: { type: String },
  status: { type: String, enum: ["PENDING", "RUNNING", "COMPLETED", "FAILED"], default: "PENDING" },
  dependsOn: { type: [String], default: [] },
  output: { type: String },
  error: { type: String },
  logs: { type: [String], default: [] },
  day: { type: Number, default: 1 }
});

const autonomousGoalSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  userId: { type: String, required: true },
  status: { type: String, enum: ["PENDING", "RUNNING", "PAUSED", "COMPLETED", "FAILED", "CANCELLED"], default: "PENDING" },
  tasks: [subtaskSchema],
  currentTaskId: { type: String },
  dailySummaries: [{
    day: { type: Number, required: true },
    summary: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
  }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

export const AutonomousGoal = mongoose.model("AutonomousGoal", autonomousGoalSchema);
