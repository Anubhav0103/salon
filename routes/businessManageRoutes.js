const express = require('express');
const serviceController = require('../controllers/serviceController');
const staffController = require('../controllers/staffController');
const staffServiceController = require('../controllers/staffServiceController');
const { getAvailableSlots } = require('../controllers/searchSalonsController');
const bookingController = require('../controllers/bookingController');
const razorpayController = require('../controllers/razorpayController');
const appointmentController = require('../controllers/bookingController');
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

// Test route for debugging
router.get('/test-staff', (req, res) => {
    const business_id = req.query.business_id;
    
    if (!business_id) {
        return res.status(400).json({ error: 'business_id required' });
    }
    
    const db = require('../config/database');
    const sql = `SELECT * FROM staff WHERE business_id = ? LIMIT 5`;
    
    db.query(sql, [business_id], (err, rows) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Database error: ' + err.message });
        }
        res.json({ 
            message: 'Test successful', 
            staff_count: rows.length, 
            staff: rows,
            business_id: business_id 
        });
    });
});

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
router.get('/eligible-staff-for-appointment', appointmentController.getEligibleStaffForAppointment);
router.put('/reassign-appointment/:appointment_id', appointmentController.reassignAppointment);

// Get business ratings
router.get('/ratings', (req, res) => {
    const business_id = req.query.business_id;
    if (!business_id) return res.status(400).json({ error: 'business_id required' });
    
    const sql = `
        SELECT r.*, b.user_name, b.service_name, s.name as staff_name
        FROM reviews r
        JOIN bookings b ON r.booking_id = b.booking_id
        LEFT JOIN staff s ON r.staff_id = s.staff_id
        WHERE b.business_id = ? AND r.rating IS NOT NULL
        ORDER BY r.created_at DESC
    `;
    
    const db = require('../config/database');
    db.query(sql, [business_id], (err, rows) => {
        if (err) {
            console.error('Error fetching ratings:', err);
            return res.status(500).json({ error: 'Error fetching ratings' });
        }
        res.json({ ratings: rows });
    });
});

// Razorpay routes
router.post('/razorpay/order', razorpayController.createOrder);

module.exports = router; 