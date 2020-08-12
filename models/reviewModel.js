const mongoose = require('mongoose');
const Tour = require('./tourModel');
// mongoose schema
const reviewSchema = new mongoose.Schema(
  {
    review: {
      type: String,
      required: [true, 'Review can not be empty'],
      trim: true,
    },
    rating: {
      type: Number,
      max: [5, 'Rating must not be above 5.0'],
      min: [1, 'Rating must not be below 1.0'],
    },
    createdAt: {
      type: Date,
      default: Date.now(),
      select: false,
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'Review must have a User'],
    },
    tour: {
      type: mongoose.Schema.ObjectId,
      ref: 'Tour',
      required: [true, 'Review must belong to a tour.'],
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

reviewSchema.index(
  { tour: 1, user: 1 },
  {
    unique: true,
  }
);

/**
 * MIDDLEWARE
 */

// Populate document
// reviewSchema.pre(/^find/, function (next) {
//   this.populate({
//     path: 'tour user',
//     select: 'name',
//   });

//   next();
// });

reviewSchema.pre(/^find/, function (next) {
  // this.populate({
  //   path: 'tour',
  //   select: 'name',
  // })
  this.populate({
    path: 'user',
    select: 'name photo',
  });

  next();
});

// Static method
reviewSchema.statics.calcAverageRatings = async function (tourId) {
  const stats = await this.aggregate([
    {
      $match: { tour: tourId },
    },
    {
      $group: {
        _id: '$tour',
        nRating: { $sum: 1 },
        avgRating: { $avg: '$rating' },
      },
    },
  ]);

  if (stats.length > 0) {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsQuantity: stats[0].nRating,
      ratingsAverage: stats[0].avgRating,
    });
  } else {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsQuantity: 0,
      ratingsAverage: 4.5,
    });
  }
};

reviewSchema.post('save', function () {
  // this points to current review
  // this.constructor points to the Model

  this.constructor.calcAverageRatings(this.tour);
  // next();
});

// Updating the reviewStats during review UPDATE and DELETE events
reviewSchema.pre(/^findOneAnd/, async function (next) {
  this.rev = await this.findOne();

  next();
});

reviewSchema.post(/^findOneAnd/, async function () {
  // await this.findOne(); does not work here, query has already been executed
  await this.rev.constructor.calcAverageRatings(this.rev.tour);
});

// review model
const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;

// You use nested route when there is a clear child and parent referencing in the resources.
