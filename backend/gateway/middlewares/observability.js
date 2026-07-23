import client from "prom-client";
import winston from "winston";

// Initialize Prometheus metrics collection
const collectDefaultMetrics = client.collectDefaultMetrics;
collectDefaultMetrics({ register: client.register });

// Custom metrics
export const httpRequestCounter = new client.Counter({
  name: "cortex_http_requests_total",
  help: "Total number of HTTP requests processed",
  labelNames: ["method", "route", "status_code"],
});

export const httpRequestDuration = new client.Histogram({
  name: "cortex_http_request_duration_seconds",
  help: "HTTP request latency in seconds",
  labelNames: ["method", "route", "status_code"],
  buckets: [0.1, 0.3, 0.5, 1, 2, 5, 10],
});

// Winston logger setup
export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  defaultMeta: { service: "api-gateway" },
  transports: [
    new winston.transports.Console(),
  ],
});

// Observability logging and metrics middleware
export function observabilityMiddleware(req, res, next) {
  const start = process.hrtime();
  
  res.on("finish", () => {
    const diff = process.hrtime(start);
    const timeInSeconds = diff[0] + diff[1] / 1e9;
    
    const route = req.baseUrl + (req.route ? req.route.path : req.path);
    
    httpRequestCounter.inc({
      method: req.method,
      route,
      status_code: res.statusCode,
    });
    
    httpRequestDuration.observe({
      method: req.method,
      route,
      status_code: res.statusCode,
    }, timeInSeconds);
    
    logger.info(`HTTP ${req.method} ${req.originalUrl}`, {
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      latency: timeInSeconds,
    });
  });
  
  next();
}

// Prometheus metrics endpoint handler
export async function metricsHandler(req, res) {
  res.setHeader("Content-Type", client.register.contentType);
  res.send(await client.register.metrics());
}
