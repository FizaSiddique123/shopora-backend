/**
 * Centralized Error Handler
 * 
 * PROBLEM IT SOLVES: Provides consistent error responses across all API endpoints.
 * Instead of scattered try-catch blocks with different error formats, this centralizes
 * error handling for maintainability and consistency.
 * 
 * HOW IT WORKS: Express error-handling middleware that catches errors and formats
 * them into standardized JSON responses with appropriate status codes.
 * 
 * REAL-WORLD: Companies use similar patterns to:
 * - Log errors centrally for monitoring
 * - Hide sensitive error details in production
 * - Provide consistent API response structure
 * - Handle different error types (validation, database, authentication)
 */

export const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log error for debugging
  console.error('Error:', err);

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    const message = 'Resource not found';
    error = { message, statusCode: 404 };
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const message = 'Duplicate field value entered';
    error = { message, statusCode: 400 };
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(val => val.message).join(', ');
    error = { message, statusCode: 400 };
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    const message = 'Invalid token';
    error = { message, statusCode: 401 };
  }

  if (err.name === 'TokenExpiredError') {
    const message = 'Token expired';
    error = { message, statusCode: 401 };
  }

  res.status(error.statusCode || 500).json({
    success: false,
    error: error.message || 'Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};







