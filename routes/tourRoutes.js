const express = require('express');
const tourController = require('./../controllers/tourController');
const authController = require('./../controllers/authController');
const reviewRouter = require('./../routes/reviewRoutes');

const router = express.Router();

const {
  getTour,
  getTours,
  createTour,
  updateTour,
  deleteTour,
  aliasTopTours,
  getTourStats,
  getMonthlyPlan,
} = tourController;

// middleware for params
// router.param('id', checkID);

/**
 * NESTED ROUTES
 */

// POST /tour/${tourId}/reviews
// GET /tour/${tourId}/reviews

// Mounting a router on the tourRoute
router.use('/:tourId/reviews', reviewRouter);

/**
 * Tour resources where "/" ====> "routes"
 */
router.route('/top-5-cheap').get(aliasTopTours, getTours);

router.route('/tours-stats').get(getTourStats);
router
  .route('/monthly-plan/:year')
  .get(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide', 'guide'),
    getMonthlyPlan
  );

router
  .route('/tours-within/:distance/center/:latlng/unit/:unit')
  .get(tourController.getToursWithin);

// Get the distance of each tour from user current location to tour.
router.route('/distances/:latlng/unit/:unit').get(tourController.getDistances);

router
  .route('/')
  .get(getTours)
  .post(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    createTour
  );

router
  .route('/:id')
  .get(getTour)
  .patch(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.uploadTourImages,
    tourController.resizeTourImages,
    updateTour
  )
  .delete(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    deleteTour
  );

module.exports = router;
