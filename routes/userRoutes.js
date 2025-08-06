const express = require('express');
const UserController = require('../controllers/userController');
const bookingController = require('../controllers/bookingController');
const authenticate = require('../middleware/auth');
const authorizeRoles = require('../middleware/role');
const { validate, schemas } = require('../middleware/validation');
const { getAvailableSlots } = require('../controllers/searchSalonsController');
const router = express.Router();

// ✅ Public routes
router.post('/register', validate(schemas.userRegisterSchema), UserController.register);
router.post('/login', validate(schemas.userLoginSchema), UserController.login);

// ✅ Protected routes (only for authenticated users)
router.get('/profile', authenticate, authorizeRoles('user'), UserController.getProfile);
router.get('/bookings', authenticate, authorizeRoles('user'), bookingController.listUserBookings);
router.post('/search-salons', authenticate, authorizeRoles('user'), require('../controllers/searchSalonsController').searchSalons);
router.post('/search-salons-with-date', authenticate, authorizeRoles('user'), validate(schemas.searchWithDateSchema), require('../controllers/searchSalonsController').searchSalonsWithDate);
router.post('/available-slots', authenticate, authorizeRoles('user'), getAvailableSlots);

module.exports = router;
