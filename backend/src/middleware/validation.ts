import { Request, Response, NextFunction } from 'express';
import { validationResult, ValidationChain } from 'express-validator';

/**
 * Middleware to handle validation errors from express-validator
 */
export function handleValidationErrors(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map(err => ({
        field: err.type === 'field' ? err.path : undefined,
        message: err.msg,
      })),
    });
    return;
  }
  
  next();
}

/**
 * Helper to run validation chains and handle errors
 * @param validations - Array of express-validator validation chains
 * @returns Middleware function
 */
export function validate(validations: ValidationChain[]) {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Run all validations
    await Promise.all(validations.map(validation => validation.run(req)));
    
    // Check for errors
    handleValidationErrors(req, res, next);
  };
}

/**
 * Validate pagination parameters
 */
export function validatePagination(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  
  if (page < 1) {
    res.status(400).json({
      success: false,
      message: 'Page must be greater than 0',
    });
    return;
  }
  
  if (limit < 1 || limit > 1000) {
    res.status(400).json({
      success: false,
      message: 'Limit must be between 1 and 1000',
    });
    return;
  }
  
  // Attach pagination to request
  req.query.page = page.toString();
  req.query.limit = limit.toString();
  
  next();
}
