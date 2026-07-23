import { Comment, Notification } from "../models/collaboration.model.js";

/**
 * Creates a comment in a shared workspace and notifies mentioned users.
 */
export async function postComment(req, res) {
  const { workspaceId, text, userName } = req.body;
  const userId = req.headers["x-user-id"] || "guest";

  if (!workspaceId || !text) {
    return res.status(400).json({ success: false, message: "workspaceId and text are required." });
  }

  try {
    const comment = await Comment.create({
      workspaceId,
      userId,
      userName: userName || "Anonymous User",
      text
    });

    // Detect @mentions (e.g., @guest or @username)
    const mentionRegex = /@(\w+)/g;
    let match;
    const mentionedUsers = new Set();
    while ((match = mentionRegex.exec(text)) !== null) {
      mentionedUsers.add(match[1]);
    }

    // Create notifications for mentioned users
    for (const mentionedUser of mentionedUsers) {
      if (mentionedUser !== userId) {
        await Notification.create({
          userId: mentionedUser,
          senderName: userName || "Someone",
          text: `Mentioned you in workspace comments: "${text.substring(0, 50)}..."`,
          type: "MENTION"
        });
      }
    }

    res.status(201).json({ success: true, comment });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * Gets comments for a workspace.
 */
export async function getComments(req, res) {
  const { workspaceId } = req.query;
  
  if (!workspaceId) {
    return res.status(400).json({ success: false, message: "workspaceId is required." });
  }

  try {
    const comments = await Comment.find({ workspaceId }).sort({ createdAt: 1 });
    res.status(200).json({ success: true, comments });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * Gets notifications for a user.
 */
export async function getNotifications(req, res) {
  const userId = req.headers["x-user-id"] || "guest";
  try {
    const notifications = await Notification.find({ userId }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, notifications });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * Marks a notification as read.
 */
export async function markNotificationRead(req, res) {
  const { id } = req.params;
  try {
    const notification = await Notification.findByIdAndUpdate(
      id,
      { read: true },
      { new: true }
    );
    if (!notification) {
      return res.status(404).json({ success: false, message: "Notification not found." });
    }
    res.status(200).json({ success: true, notification });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}
