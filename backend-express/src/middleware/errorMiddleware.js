const errorMiddleware = (err, req, res, next) => {
  console.error('Error:', err);

  // Default error
  let error = {
    message: err.message || 'Internal Server Error',
    status: err.status || 500,
  };

  // Prisma errors
  if (err.code === 'P2002') {
    error = {
      message: 'Duplicate entry. This record already exists.',
      status: 409,
    };
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    error = {
      message: 'Invalid token',
      status: 401,
    };
  }

  if (err.name === 'TokenExpiredError') {
    error = {
      message: 'Token expired',
      status: 401,
    };
  }

  // Validation errors
  if (err.name === 'ValidationError') {
    error = {
      message: 'Validation failed',
      status: 400,
      details: err.details,
    };
  }

  // Send error response
  res.status(error.status).json({
    error: error.message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    ...(error.details && { details: error.details }),
  });
};

module.exports = errorMiddleware;
