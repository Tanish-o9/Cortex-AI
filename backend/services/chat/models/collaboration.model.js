import mongoose from "mongoose";

const commentSchema = new mongoose.Schema({
  workspaceId: { type: String, required: true },
  userId: { type: String, required: true },
  userName: { type: String, required: true },
  text: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

const notificationSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  senderName: { type: String, required: true },
  text: { type: String, required: true },
  type: { type: String, enum: ["MENTION", "COMMENT", "ALERT"], default: "ALERT" },
  read: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

export const Comment = mongoose.model("Comment", commentSchema);
export const Notification = mongoose.model("Notification", notificationSchema);
