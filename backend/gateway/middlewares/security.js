import rateLimit from "express-rate-limit";
import helmet from "helmet";

// Security headers configurations
export const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "http://localhost:8000", "ws://localhost:8000"],
    },
  },
});

// API Rate Limiting configuration
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // Limit each IP to 200 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: 429,
    message: "Too many requests from this IP, please try again after 15 minutes",
  },
});

// CSRF checking middleware (lightweight token check in custom headers)
export function csrfProtection(req, res, next) {
  // Allow safe methods
  if (["GET", "HEAD", "OPTIONS"].includes(req.method)) {
    return next();
  }
  
  const csrfToken = req.headers["x-csrf-token"];
  const csrfCookie = req.cookies ? req.cookies["csrf-token"] : null;
  
  if (process.env.NODE_ENV === "production" && (!csrfToken || csrfToken !== csrfCookie)) {
    return res.status(403).json({
      success: false,
      message: "CSRF token validation failed",
    });
  }
  
  next();
}
