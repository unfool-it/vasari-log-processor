import pino from 'pino';
import { config } from '../config/index.js';

/**
 * Production-ready, JSON-structured logging framework.
 * Optimized for ingestion by sovereign SIEM platforms.
 * 
 * Enhancements:
 * 1. Added redaction for sensitive security fields.
 * 2. Maintained uppercase level formatting for SIEM compatibility.
 */
export const logger = pino({
  level: config.LOG_LEVEL || 'info',
  base: { 
    service: 'vasari-gateway',
    env: process.env.NODE_ENV 
  },
  timestamp: pino.stdTimeFunctions.isoTime,
  formatters: {
    level: (label) => ({ level: label.toUpperCase() }),
  },
  // Security: Redact sensitive information from log objects
  redact: {
    paths: [
      'req.headers.authorization',
      'req.headers.cookie',
      'res.headers["set-cookie"]',
      'password',
      'token',
      'apiKey'
    ],
    remove: true
  }
});
