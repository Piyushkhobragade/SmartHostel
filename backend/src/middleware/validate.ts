import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';

/**
 * Middleware factory that validates req.body against a Zod schema.
 * On failure, returns 422 with structured field errors.
 */
export function validate(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const errors = result.error.issues.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      }));
      res.status(422).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Request body validation failed',
          fields: errors,
        },
      });
      return;
    }
    // Replace body with parsed (coerced / defaulted) values
    req.body = result.data;
    next();
  };
}

/**
 * Middleware factory that validates req.query against a Zod schema.
 */
export function validateQuery(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.query);
    if (!result.success) {
      const errors = result.error.issues.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      }));
      res.status(422).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Query parameter validation failed',
          fields: errors,
        },
      });
      return;
    }
    (req as any).parsedQuery = result.data;
    next();
  };
}
