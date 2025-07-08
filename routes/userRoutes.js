const express = require('express');
const UserController = require('../controllers/userController');
const bookingController = require('../controllers/bookingController');
const router = express.Router();

// User routes
router.post('/register', UserController.register);
router.post('/login', UserController.login);
router.get('/profile', UserController.getProfile);
router.get('/bookings', bookingController.listUserBookings);

module.exports = router; 