const express = require('express');
const serviceController = require('../controllers/serviceController');
const staffController = require('../controllers/staffController');
const staffServiceController = require('../controllers/staffServiceController');
const { getAvailableSlots } = require('../controllers/searchSalonsController');
const bookingController = require('../controllers/bookingController');
const razorpayController = require('../controllers/razorpayController');
const router = express.Router();

// Service routes
router.post('/services', serviceController.addService);
router.get('/services', serviceController.listServices);
router.get('/services/:id', serviceController.getService);
router.put('/services/:id', serviceController.editService);
router.delete('/services/:id', serviceController.removeService);

// Staff routes
router.post('/staff', staffController.addStaff);
router.get('/staff', staffController.listStaff);
router.get('/staff/:id', staffController.getStaff);
router.put('/staff/:id', staffController.editStaff);
router.delete('/staff/:id', staffController.removeStaff);

// Staff-Service assignment routes
router.post('/staff-services/assign', staffServiceController.assignService);
router.post('/staff-services/unassign', staffServiceController.unassignService);
router.get('/staff-services/by-staff', staffServiceController.listServicesForStaff);
router.get('/staff-services/by-service', staffServiceController.listStaffForService);

// Add route for all unique services (for booking page)
router.get('/services-all', serviceController.listAllUniqueServices);

// Add route for all catalog services (for business services form)
router.get('/services-catalog', serviceController.listCatalogServices);

// Add search salons endpoint
router.post('/search-salons', require('../controllers/searchSalonsController').searchSalons);

// Add search salons with date validation endpoint
router.post('/search-salons-with-date', require('../controllers/searchSalonsController').searchSalonsWithDate);

// Add available slots endpoint
router.post('/available-slots', getAvailableSlots);

// Add booking route
router.post('/bookings', bookingController.addBooking);

// Appointments management
router.get('/appointments', bookingController.listAppointments);
router.post('/appointments/:id/complete', bookingController.completeAppointment);

// Razorpay routes
router.post('/razorpay/order', razorpayController.createOrder);

module.exports = router; 