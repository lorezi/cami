const Review = require('../models/reviewModel');
// const catchAsync = require('../utils/catchAsync');

const factory = require('./handlerFactory');

// Middleware to set tour and user from body
exports.setTourUserIds = (req, res, next) => {
  // if no tour in the request body, get from the request parameter
  if (!req.body.tour) req.body.tour = req.params.tourId;
  // if no user in the request body, get from the logged user
  if (!req.body.user) req.body.user = req.user.id;

  next();
};

exports.getReviews = factory.getAll(Review);

exports.getReview = factory.getOne(Review);

exports.createReview = factory.createOne(Review);

exports.updateReview = factory.updateOne(Review);

exports.deleteReview = factory.deleteOne(Review);
