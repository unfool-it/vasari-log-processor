import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger.js';
// RECTIFIED: Pointing to the correct index file in the config directory
import { config } from '../config/index.js'; 

export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public isOperational = true
  ) {
    super(message);
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

  logger.error({
    msg: message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    isOperational
  });

  res.status(statusCode).json({
    status: 'error',
    code: statusCode,
    message: config.NODE_ENV === 'production' && !isOperational 
      ? 'An internal system error occurred' 
      : message,
  });
};
