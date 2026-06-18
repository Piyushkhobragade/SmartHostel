import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../errors/AppError';
import { logger } from '../lib/logger';

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let statusCode = 500;
  let code = 'INTERNAL_SERVER_ERROR';
  let message = 'An unexpected error occurred';
  let details = undefined;

  if (err instanceof AppError) {
    statusCode = err.statusCode;
    code = err.code;
    message = err.message;
  } else if (err instanceof ZodError) {
    statusCode = 422;
    code = 'VALIDATION_ERROR';
    message = 'Invalid input data';
    details = err.flatten().fieldErrors as any;
  } else if ((err as any).code === 'P2002') {
    statusCode = 409;
    code = 'CONFLICT';
    message = 'Resource already exists';
  } else if ((err as any).code === 'P2025') {
    statusCode = 404;
    code = 'NOT_FOUND';
    message = 'Resource not found';
  }

  if (statusCode === 500) {
    logger.error({ err, reqId: (req as any).id }, 'Unhandled Exception');
  } else {
    logger.warn({ err: err.message, reqId: (req as any).id }, `Operational Error: ${code}`);
  }

  res.status(statusCode).json({
    error: {
      code,
      message,
      details,
      requestId: (req as any).id
    }
  });
};
