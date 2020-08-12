const express = require('express');
const userController = require('../controllers/userController');
const authController = require('../controllers/authController');

const router = express.Router();
const {
  getUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
} = userController;

/**
 * Authentication and Authorization
 */

router.post('/signup', authController.signup);
router.post('/login', authController.login);
router.get('/logout', authController.logout);

router.post('/forgotPassword', authController.forgotPassword);
router.patch('/resetPassword/:token', authController.resetPassword);

// Middleware bulk application to a route in order to protect all routes
router.use(authController.protect);

router.patch('/updatePassword', authController.updatePassword);

router.get('/me', userController.getMe, userController.getUser);
router.patch(
  '/updateMe',
  userController.uploadUserPhoto,
  userController.resizeUserPhoto,
  userController.updateMe
);
router.delete('/deleteMe', userController.deleteMe);

/**
 * User resources
 */

router.use(authController.restrictTo('admin'));

router.route('/').get(getUsers).post(createUser);

router.route('/:id').get(getUser).patch(updateUser).delete(deleteUser);

module.exports = router;
