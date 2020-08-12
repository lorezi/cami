const express = require('express');
const viewController = require('../controllers/viewsController');
const authController = require('../controllers/authController');
const bookingController = require('../controllers/bookingController');

const router = express.Router();

// router.use(authController.isLoggedIn);

router.get(
  '/',
  bookingController.createBookingCheckout,
  authController.isLoggedIn,
  viewController.getOverview
);

router.get('/tour/:slug', authController.isLoggedIn, viewController.getTour);

router.get('/login', authController.isLoggedIn, viewController.getLoginForm);

router.get('/account', authController.protect, viewController.getAccount);

router.get('/my-tours', authController.protect, viewController.getMyTours);

// POST ROUTE FOR FORM DATA

// router.post(
//   '/submit-user-data',
//   authController.protect,
//   viewController.updateUserData
// );

module.exports = router;
