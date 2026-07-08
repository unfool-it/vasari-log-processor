import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger.js';
// Added missing import (adjust path as necessary)
import { config } from '../config/config.js'; 

/**
 * Standardized error interception using custom serializable AppError structures.
 */
export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public isOperational = true
  ) {
    super(message);
    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AppError);
    }
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const isAppError = err instanceof AppError;
  const statusCode = isAppError ? err.statusCode : 500;
  const isOperational = isAppError ? err.isOperational : false;
  const message = err.message || 'Internal Server Error';

  // Enhanced Logging
  logger.error({
    msg: message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    isOperational
  });

  // Response sent to client
  res.status(statusCode).json({
    status: 'error',
    code: statusCode,
    message: config.NODE_ENV === 'production' && !isOperational 
      ? 'An internal system error occurred' 
      : message,
  });

  // If error is not operational, consider a graceful shutdown
  if (!isOperational) {
    // logger.error('Non-operational error detected. Potential process instability.');
    // process.exit(1); // Standard practice in some architectures
  }
};
