import express from "express";
import { createConversation, getConversations, getMessages, saveMessage, updateConversation } from "../controllers/chat.controller.js";
import { postComment, getComments, getNotifications, markNotificationRead } from "../controllers/collaboration.controller.js";

const router = express.Router();

router.post("/create-conversation",createConversation);
router.get("/get-conversations",getConversations);
router.post("/update-conversation",updateConversation);
router.post("/save-message",saveMessage);
router.get("/get-messages/:id",getMessages);

// Collaboration endpoints
router.post("/collaboration/comments", postComment);
router.get("/collaboration/comments", getComments);
router.get("/collaboration/notifications", getNotifications);
router.post("/collaboration/notifications/:id/read", markNotificationRead);

// Graph memory endpoints
import { extractRelations, getGraph, searchGraph } from "../controllers/graphMemory.controller.js";
router.post("/graph/extract", extractRelations);
router.get("/graph", getGraph);
router.get("/graph/search", searchGraph);

export default router;