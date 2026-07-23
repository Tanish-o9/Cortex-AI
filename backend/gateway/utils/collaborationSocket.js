import { WebSocketServer } from "ws";
import redis from "../../shared/redis/redis.js";

const clients = new Map(); // wsClient -> { userId, userName, workspaceId }

/**
 * Initializes the Collaboration WebSocket server.
 * @param {Object} server HTTP Server instance 
 */
export function initCollaborationSocket(server) {
  const wss = new WebSocketServer({ noServer: true });

  server.on("upgrade", (request, socket, head) => {
    const url = new URL(request.url, `http://${request.headers.host}`);
    if (url.pathname === "/collaboration") {
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit("connection", ws, request);
      });
    }
  });

  // Redis subscription for cross-instance sync
  const pubClient = redis;
  const subClient = redis.duplicate();

  subClient.connect().then(() => {
    console.log("✅ Redis Collaboration Subscriber Connected");
    subClient.subscribe("workspace_events");
  }).catch(err => {
    console.error("❌ Failed to connect duplicate Redis for WS subscriber:", err.message);
  });

  subClient.on("message", (channel, message) => {
    if (channel === "workspace_events") {
      try {
        const event = JSON.parse(message);
        broadcastToWorkspaceLocal(event.workspaceId, event, event.senderId);
      } catch (err) {
        console.error("[WS Redis Sync] Error parsing event:", err);
      }
    }
  });

  wss.on("connection", (ws, req) => {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const userId = url.searchParams.get("userId") || "guest";
    const userName = url.searchParams.get("userName") || "Guest User";
    const workspaceId = url.searchParams.get("workspaceId") || "default";

    const clientInfo = { userId, userName, workspaceId };
    clients.set(ws, clientInfo);

    console.log(`[WS] Client Connected: ${userName} (${userId}) in Workspace [${workspaceId}]`);

    // Notify others of new user presence
    const joinEvent = {
      type: "presence",
      action: "join",
      userId,
      userName,
      workspaceId,
      timestamp: new Date()
    };
    publishWorkspaceEvent(workspaceId, joinEvent, userId);

    // Send initial list of present users in this workspace to the newly connected user
    const presentUsers = [];
    for (const [_, info] of clients.entries()) {
      if (info.workspaceId === workspaceId) {
        presentUsers.push({ userId: info.userId, userName: info.userName });
      }
    }
    ws.send(JSON.stringify({ type: "presence_list", users: presentUsers }));

    ws.on("message", (msg) => {
      try {
        const data = JSON.parse(msg);
        
        switch (data.type) {
          case "cursor_move":
            // Broadcast cursor coordinates
            publishWorkspaceEvent(workspaceId, {
              type: "cursor",
              userId,
              userName,
              workspaceId,
              x: data.x,
              y: data.y
            }, userId);
            break;
            
          case "typing":
            // Broadcast typing state
            publishWorkspaceEvent(workspaceId, {
              type: "typing",
              userId,
              userName,
              workspaceId,
              isTyping: data.isTyping
            }, userId);
            break;

          case "comment":
            // Broadcast comment
            publishWorkspaceEvent(workspaceId, {
              type: "comment",
              userId,
              userName,
              workspaceId,
              comment: data.comment
            }, userId);
            break;

          default:
            console.log(`[WS] Unhandled message type: ${data.type}`);
        }
      } catch (err) {
        console.error("[WS] Message parsing error:", err.message);
      }
    });

    ws.on("close", () => {
      console.log(`[WS] Client Disconnected: ${userName}`);
      clients.delete(ws);
      
      // Notify presence exit
      publishWorkspaceEvent(workspaceId, {
        type: "presence",
        action: "leave",
        userId,
        userName,
        workspaceId,
        timestamp: new Date()
      }, userId);
    });

    ws.on("error", (err) => {
      console.error(`[WS] Socket error for ${userName}:`, err.message);
    });
  });

  /**
   * Publishes event to Redis Pub/Sub for cross-instance and local dispatch.
   */
  function publishWorkspaceEvent(workspaceId, event, senderId) {
    const messagePayload = JSON.stringify({ ...event, workspaceId, senderId });
    pubClient.publish("workspace_events", messagePayload).catch(err => {
      console.error("[WS Redis Publish] Failed:", err.message);
    });
  }

  /**
   * Broadcasts to local sockets connected directly to this server instance.
   */
  function broadcastToWorkspaceLocal(workspaceId, event, senderId) {
    const payload = JSON.stringify(event);
    for (const [ws, info] of clients.entries()) {
      if (info.workspaceId === workspaceId && info.userId !== senderId) {
        if (ws.readyState === 1) { // OPEN
          ws.send(payload);
        }
      }
    }
  }
}
