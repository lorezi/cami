const AppError = require('../utils/appError');

handleCastErrorDB = (err) => {
  const message = `Invalid ${err.path}: ${err.value}`;
  return new AppError(message, 400);
};

handleDuplicateFieldsDB = (err) => {
  const message = `Duplicate field value: ${err.keyValue.name}. Please use another value`;
  return new AppError(message, 400);
};

handleValidationErrorDB = (err) => {
  const errors = Object.values(err.errors).map((el) => el.message);

  const message = `Invalid input data. ${errors.join('. ')}`;
  return new AppError(message, 400);
};

handleJWTError = () => new AppError('Invalid token. Please log in again.', 401);

const handleJWTExpireError = () =>
  new AppError('Token expired. Please log in again', 401);

const sendErrorDev = (err, res, req) => {
  // API
  if (req.originalUrl.startsWith('/api')) {
    res.status(err.statusCode).json({
      status: err.status,
      err: err,
      message: err.message,
      stack: err.stack,
    });
  } else {
    // RENDERED PAGE
    res.status(err.statusCode).render('error', {
      title: 'Something went wrong!',
      msg: err.message,
    });
  }
};

const sendErrorProd = (err, res, req) => {
  // API
  if (req.originalUrl.startsWith('/api')) {
    // Operational trusted error
    if (err.isOperational) {
      return res.status(err.statusCode).json({
        status: err.status,
        message: err.message,
      });

      // Programming or other unknown error: don't want to leak error details
    }
    // 1. Log error
    console.error('ERROR 🔥🔥🔥', err);

    // 2. Send generic message
    return res.status(500).json({
      status: 'error',
      message: 'Something went very wrong!',
    });
  }

  // RENDERED PAGE
  if (err.isOperational) {
    return res.status(err.statusCode).render('error', {
      title: 'Something went wrong!',
      msg: err.message,
    });
  }
  // 1. Log error
  console.error('Error 🔥', err);

  // 2. Send generic message
  // Programming or other unknown error: don't want to leak error details
  return res.status(err.statusCode).render('error', {
    title: 'Something went wrong!',
    msg: 'Please try again later',
  });
};

module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    // console.log(err.stack.split(':')[0].trim());
    sendErrorDev(err, res, req);
  } else if (process.env.NODE_ENV.trim() === 'production') {
    let error = { ...err };
    error.message = err.message;
    // console.log(err.stack.split(':')[0].trim());
    if (error.kind === 'ObjectId') error = handleCastErrorDB(error);
    if (error.code === 11000) error = handleDuplicateFieldsDB(error);
    if (err.stack.split(':')[0].trim() === 'ValidationError')
      error = handleValidationErrorDB(error);
    if (error.name === 'JsonWebTokenError') error = handleJWTError();
    if (error.name === 'TokenExpiredError') error = handleJWTExpireError();

    sendErrorProd(error, res, req);
  }
};
