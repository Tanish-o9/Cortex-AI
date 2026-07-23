import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import redis from "../shared/redis/redis.js";
import dotenv from "dotenv";
import { createProxyMiddleware } from "http-proxy-middleware";
import { proxyWithUser } from "./utils/proxyWithHeaders.js";
import { protect } from "./middlewares/auth.middleware.js";
import { getCurrentUser } from "./controllers/user.controller.js";
import cookieParser from "cookie-parser"
import { securityHeaders, apiLimiter, csrfProtection } from "./middlewares/security.js";
import { observabilityMiddleware, metricsHandler } from "./middlewares/observability.js";
import { initCollaborationSocket } from "./utils/collaborationSocket.js";

dotenv.config();
const cleanUrl = (url) => url ? url.replace(/['"]/g, "").trim() : "";
const authService = cleanUrl(process.env.AUTH_SERVICE);
const chatService = cleanUrl(process.env.CHAT_SERVICE);
const agentService = cleanUrl(process.env.AGENT_SERVICE);
const billingService = cleanUrl(process.env.BILLING_SERVICE);

const app = express();
const port=process.env.PORT || 5000

app.use(observabilityMiddleware);
app.get("/metrics", metricsHandler);

app.use(cors({
    origin:"http://localhost:5173",
    credentials:true
}));
app.use(
  "/uploads",
  express.static("uploads")
);
app.use(cookieParser());
app.use(securityHeaders);
app.use(apiLimiter);
app.use(csrfProtection);
app.use(morgan("dev"));
app.use("/api/auth/login", createProxyMiddleware({
  target: authService,
  changeOrigin: true,
  pathRewrite: () => "/login"
}));
app.use("/api/auth/logout", createProxyMiddleware({
  target: authService,
  changeOrigin: true,
  pathRewrite: () => "/logout"
}));
app.use("/api/auth/organizations", protect, proxyWithUser(authService, "/organizations"));
app.use("/api/auth/teams", protect, proxyWithUser(authService, "/teams"));
app.use("/api/auth/projects", protect, proxyWithUser(authService, "/projects"));
app.use("/api/auth/members", protect, proxyWithUser(authService, "/members"));
app.use("/api/auth/audit-logs", protect, proxyWithUser(authService, "/audit-logs"));
app.use("/api/me", protect, getCurrentUser);
app.use("/api/chat", protect, proxyWithUser(chatService));
app.use("/api/agent", protect, proxyWithUser(agentService));
app.use("/api/billing", protect, proxyWithUser(billingService));


app.get("/", (req, res) => {
  res.status(200).json({
    service: "gateway",
    status: "ok"
  });
});


const server = app.listen(port, () => {
  console.log(
    `Gateway running on ${port}`
  );
});
initCollaborationSocket(server);
