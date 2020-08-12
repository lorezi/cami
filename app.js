const path = require('path');
const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitizer = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
// const cors = require('cors');
const cookieParser = require('cookie-parser');

const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const reviewRouter = require('./routes/reviewRoutes');
const bookingRouter = require('./routes/bookingRoutes');
const viewRouter = require('./routes/viewRoutes');

const globalErrorHandler = require('./controllers/errorController');
const AppError = require('./utils/appError');

const app = express();

// const corsOptions = {
//   origin: 'http://localhost:9009',
//   optionSuccessStatus: 200,
// };

// Setting up the view template
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

const api = '/api/v1';

// Global middleware

// Serving static files
// app.use(express.static(`${__dirname}/public`));
app.use(express.static(path.join(__dirname, 'public')));

// Set security HTTP headers
app.use(helmet());

// Development logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Limit request from a particular IP address
const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000, //1hr ==> min * sec * 10^3
  message: 'Too many request from this IP, please try again in an hour!',
});
app.use('/api', limiter);

// Body parser, reading data from the body into req.body
// middleware ===> modifies the request
// Limit the number of data we can pass into a body response
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());

// Data sanitization against NoSQL query injection
app.use(mongoSanitizer());

// Data sanitization against XSS
app.use(xss());

// Prevent parameter pollution => always use at the end of the app file
app.use(
  hpp({
    whitelist: [
      'duration',
      'ratingsQuantity',
      'ratingsAverage',
      'maxGroupSize',
      'difficulty',
      'price',
    ],
  })
);

// create middleware 1
// app.use((req, res, next) => {
//   console.log('Hello from the middleware 👏👏');
//   next();
// });

// Test middleware 2
app.use((req, res, next) => {
  const timeZone = new Date().getTimezoneOffset() * 60000;
  const localISOTime = new Date(Date.now() - timeZone)
    .toISOString()
    .slice(0, -1);
  req.requestTime = localISOTime;
  next();
});

// app.use(cors(corsOptions));

// Mounting the router as a middleware

app.use('/', viewRouter);
app.use(`${api}/tours`, tourRouter);
app.use(`${api}/users`, userRouter);
app.use(`${api}/reviews`, reviewRouter);
app.use(`${api}/bookings`, bookingRouter);

app.all('*', (req, res, next) => {
  // res.status(404).json({
  //   status: 'fail',
  //   message: `Can't find ${req.originalUrl} on this server!'`,
  // });
  // const err = new Error(`Can't find ${req.originalUrl} on this server!'`);
  // err.status = 'fail';
  // err.statusCode = 404;
  next(new AppError(`Can't find ${req.originalUrl} on this server!'`, 404));
});

app.use(globalErrorHandler);

module.exports = app;
