const express = require('express');
const serviceController = require('../controllers/serviceController');
const staffController = require('../controllers/staffController');
const staffServiceController = require('../controllers/staffServiceController');
const { getAvailableSlots } = require('../controllers/searchSalonsController');
const bookingController = require('../controllers/bookingController');
const razorpayController = require('../controllers/razorpayController');
const appointmentController = require('../controllers/bookingController');
const authenticate = require('../middleware/auth');
const authorizeRoles = require('../middleware/role');
const { validate, schemas } = require('../middleware/validation');

const router = express.Router();

// --- Public / User-Accessible Routes ---
router.get('/services-catalog', serviceController.listCatalogServices);
router.get('/services', serviceController.listServices);
router.get('/services-all', serviceController.listAllUniqueServices);
router.post('/search-salons', require('../controllers/searchSalonsController').searchSalons);
router.post('/search-salons-with-date', validate(schemas.searchWithDateSchema), require('../controllers/searchSalonsController').searchSalonsWithDate);
router.post('/available-slots', getAvailableSlots);

// ✅ FIX: Moved Razorpay route here. It now only requires a user to be logged in (any role).
router.post('/razorpay/order', authenticate, razorpayController.createOrder);

// ✅ FIX: The booking route should be here as well, accessible to any logged-in user.
router.post('/bookings', authenticate, bookingController.addBooking);


// --- Protected Business-Only Routes ---
// This middleware now only applies to the routes listed BELOW it.
router.use(authenticate, authorizeRoles('business'));

// Services
router.post('/services', validate(schemas.serviceCreateSchema), serviceController.addService);
router.put('/services/:id', validate(schemas.serviceUpdateSchema), serviceController.editService);
router.get('/services/:id', serviceController.getService);
router.delete('/services/:id', serviceController.removeService);

// Staff
router.post('/staff', validate(schemas.staffSchema), staffController.addStaff);
router.get('/staff', staffController.listStaff);
router.get('/staff/:id', staffController.getStaff);
router.put('/staff/:id', validate(schemas.staffSchema), staffController.editStaff);
router.delete('/staff/:id', staffController.removeStaff);

// Staff-Service assignment
router.post('/staff-services/assign', validate(schemas.assignServiceSchema), staffServiceController.assignService);
router.post('/staff-services/unassign', validate(schemas.assignServiceSchema), staffServiceController.unassignService);
router.get('/staff-services/by-staff', staffServiceController.listServicesForStaff);
router.get('/staff-services/by-service', staffServiceController.listStaffForService);

// Appointments (for business management)
router.get('/appointments', bookingController.listAppointments);
router.post('/appointments/:id/complete', bookingController.completeAppointment);
router.get('/eligible-staff-for-appointment', appointmentController.getEligibleStaffForAppointment);
router.put('/reassign-appointment/:appointment_id', appointmentController.reassignAppointment);

// Ratings (for business to view)
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
        if (err) return res.status(500).json({ error: 'Error fetching ratings' });
        res.json({ ratings: rows });
    });
});

module.exports = router;