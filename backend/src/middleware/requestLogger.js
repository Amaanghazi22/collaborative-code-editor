import { randomUUID } from "crypto";
import logger from "../utils/logger.js";

export function requestLogger(req, res, next) {
  const requestId = randomUUID();
  const start = Date.now();

  req.requestId = requestId;
  res.setHeader("x-request-id", requestId);

  res.on("finish", () => {
    const duration = Date.now() - start;
    const level = res.statusCode >= 500 ? "error" : res.statusCode >= 400 ? "warn" : "info";
    logger[level](`${req.method} ${req.path}`, {
      status: res.statusCode,
      durationMs: duration,
      requestId,
      ip: req.ip,
    });
  });

  next();
}
