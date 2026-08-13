import { logger } from '@utils/logger';
import type { ValidationError } from 'class-validator';
import { NextFunction, Request, Response } from 'express';
import { HttpError } from 'routing-controllers';

interface HandledHttpError extends HttpError {
  status?: number;
  errors?: ValidationError[];
}

// Helper function to sanitize log input by removing CR and LF characters
function sanitizeLogInput(input: string): string {
  return input.replace(/[\r\n]/g, '');
}

const errorMiddleware = (error: HandledHttpError, req: Request, res: Response, next: NextFunction) => {
  try {
    const status = error.status ?? error.httpCode ?? 500;
    const message: string = error.message || 'Something went wrong';
    const errors: string =
      error.errors && error.errors.length > 0
        ? JSON.stringify(error.errors.map(error => ({ property: error.property, constraints: error.constraints })))
        : '';

    // Sanitize user-controlled input before logging
    const safeMethod = sanitizeLogInput(req.method);
    const safePath = sanitizeLogInput(req.path);
    const safeMessage = sanitizeLogInput(message);
    const safeErrors = sanitizeLogInput(errors);

    console.error(`[${safeMethod}] ${safePath} >> StatusCode:: ${status}, Message:: ${safeMessage}, Errors:: ${safeErrors}`);
    logger.error(`[${safeMethod}] ${safePath} >> StatusCode:: ${status}, Message:: ${safeMessage}, Errors:: ${safeErrors}`);
    res.status(status).json({ message });
  } catch (error) {
    next(error);
  }
};

export default errorMiddleware;
