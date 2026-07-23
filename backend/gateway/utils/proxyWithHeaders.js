import { createProxyMiddleware } from "http-proxy-middleware";

/**
 * Custom proxy middleware that forwards user details inside headers.
 */
export const proxyWithUser = (serviceUrl, targetPath = null) => {
  return createProxyMiddleware({
    target: serviceUrl,
    changeOrigin: true,
    pathRewrite: targetPath ? () => targetPath : null,
    on: {
      proxyReq: (proxyReq, req, res) => {
        if (req.user) {
          proxyReq.setHeader("x-user-id", String(req.user.userId || req.user.uid || ""));
          proxyReq.setHeader("x-user-email", String(req.user.email || ""));
          proxyReq.setHeader("x-user-avatar", String(req.user.avatar || ""));
        }
      }
    }
  });
};