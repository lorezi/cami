const express = require('express');
const bookingController = require('../controllers/bookingController');
const authController = require('../controllers/authController');

const router = express.Router({ mergeParams: true });

router.use(authController.protect);

router.get(
  '/checkout-session/:tourId',
  authController.protect,
  bookingController.getCheckoutSession
);

router.use(authController.restrictTo('admin', 'lead-guide'));

router
  .route('/')
  .get(bookingController.getBookings)
  .post(bookingController.createBooking);

router
  .route('/:id')
  .get(bookingController.getBooking)
  .patch(bookingController.updateBooking)
  .delete(bookingController.deleteBooking);
module.exports = router;

//  TODO
/**
 * Implement restriction that users can only review a tour that they have actually booked;
 *
 * Implement nested booking routes: /tours/:id/bookings and /users/:id/bookings;
 *
 * Improve tour dates: add a participants and a soldOut field to each date. A date then becomes like an instance of the tour. Then, when a user books, they need to select one of the dates. A new booking will increase the number of participants in the date, until is booked out (participants > maxGroupSize). So, when a user wants to book, you need to check if the tour on the selected date is still available.
 *
 */
