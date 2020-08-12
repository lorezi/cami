const crypto = require('crypto');
const { promisify } = require('util');
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const Email = require('../utils/email');

const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

const getToken = (authorization) => {
  let token;
  if (authorization && authorization.startsWith('Bearer')) {
    token = authorization.split(' ')[1];
  }

  return token;
};

const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);

  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
  };

  if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;

  // Converting the expiration time to milliseconds
  res.cookie('jwt', token, cookieOptions);

  user.password = undefined;
  user.active = undefined;
  user.__v = undefined;

  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user,
    },
  });
};

exports.signup = catchAsync(async (req, res, next) => {
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
    // passwordChangedAt: req.body.passwordChangedAt,
    role: req.body.role,
  });

  // Send signup email
  const url = `${req.protocol}://${req.get('host')}/account`;
  // TODO check for mail sending failure
  await new Email(newUser, url).sendWelcome();

  //  Create and send token
  createSendToken(newUser, 201, res);
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  // 1. Check if email and password exist
  if (!email || !password) {
    return next(new AppError('Please provide email and password!', 400));
  }

  // 2. Check if user exists and password is correct
  const user = await User.findOne({ email }).select('+password');
  // const correct = await user.correctPassword(password, user.password);

  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError('Incorrect email and password', 401));
  }

  // 3. If everything ok, send token to client
  createSendToken(user, 200, res);
});

exports.logout = (req, res) => {
  res.cookie('jwt', 'loggedOut', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });

  res.status(200).json({
    status: 'success',
  });
};

exports.protect = catchAsync(async (req, res, next) => {
  // 1. Get token and check if it's there
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies) {
    token = req.cookies.jwt;
  }

  // const token = getToken(req.headers.authorization);

  if (!token) {
    return next(
      new AppError('You are not log in! Please log in to get access.', 401)
    );
  }

  // 2. Verification token
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  // 3. Check if user still exists
  const loggedUser = await User.findById(decoded.id);
  if (!loggedUser) {
    return next(new AppError('The user of this token no longer exist.', 401));
  }

  // 4. Check if user changed password after the token was issued
  if (loggedUser.changedPasswordAfter(decoded.iat)) {
    return next(
      new AppError('User recently changed password! Please log in again', 401)
    );
  }

  // Grant access to protected route
  req.user = loggedUser;
  // There is a logged in user
  // Creating a variable that will be available in pug template
  res.locals.user = loggedUser;

  next();
});

exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    // roles ['admin', 'lead-guide']. role='user'
    // Check if the loggedUser role is equal to or includes any of the roles
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError('You don not have permission to perform this action', 403)
      );
    }

    next();
  };
};

exports.forgotPassword = catchAsync(async (req, res, next) => {
  // 1. Get user based on posted email address
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(new AppError('There is no user with email address.', 404));
  }

  // 2. Generate a random token
  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  try {
    // 3. Send it to user's email address
    const resetURL = `${req.protocol}://${req.get(
      'host'
    )}/api/v1/users/resetPassword/${resetToken}
  `;

    await new Email(user, resetURL).sendPasswordReset();

    res.status(200).json({
      status: 'success',
      message: 'Token sent to email',
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });

    return next(new AppError('Error sending email', 500));
  }
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  // 1. Get user based on the password
  const hashToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');
  const user = await User.findOne({
    passwordResetToken: hashToken,
    passwordResetExpires: { $gt: Date.now() },
  });

  // 2. If token has not yet expired and there is a user, set the new password
  if (!user) {
    return next(new AppError('Token is invalid or expired', 400));
  }
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();
  // 3. Update changedPasswordAt property for the user

  // 4. Log the user in and send JWT
  createSendToken(user, 200, res);
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  // 1. Get user from collection
  const loggedUser = await User.findById(req.user.id).select('+password');

  // 2. Check if POSTed current password is correct
  if (!req.body.password) {
    return next(new AppError('Please enter password', 404));
  }

  if (
    !(await loggedUser.correctPassword(
      req.body.passwordCurrent,
      loggedUser.password
    ))
  ) {
    // console.log()
    return next(new AppError('Incorrect password', 401));
  }
  // 3. If so, update password
  loggedUser.password = req.body.password;
  loggedUser.passwordConfirm = req.body.passwordConfirm;
  await loggedUser.save();

  // 4. Log user in and send JWT
  // console.log(loggedUser.id);
  // const newToken = signToken(loggedUser.id);
  // res.status(200).json({
  //   status: 'success',
  //   token: newToken,
  // });

  createSendToken(loggedUser, 200, res);
});

// Only for rendering pages, no errors
exports.isLoggedIn = async (req, res, next) => {
  // 1. Get token and check if it's there

  if (req.cookies.jwt) {
    try {
      // 2. Verification of token
      const decoded = await promisify(jwt.verify)(
        req.cookies.jwt,
        process.env.JWT_SECRET
      );

      // 3. Check if user still exists
      const loggedUser = await User.findById(decoded.id);
      if (!loggedUser) {
        return next();
      }

      // 4. Check if user changed password after the token was issued
      if (loggedUser.changedPasswordAfter(decoded.iat)) {
        return next();
      }

      // There is a logged in user
      // Creating a variable that will be available in pug template
      res.locals.user = loggedUser;
      return next();
    } catch (error) {
      return next();
    }
  }
  next();
};
