const { createBooking } = require('../models/Booking');
const { getServiceById } = require('../models/Service');
const { getStaffByBusinessAndService, getBookingsForStaffOnDate } = require('../models/Staff');
const db = require('../config/database');
const { sendMail } = require('../utils/mailjet');
const crypto = require('crypto');
const { getBookingDetailsById } = require('../models/Booking');
const { createAppError } = require('../middleware/errorHandler');

function addBooking(req, res, next) {
    const { user_id, business_id, service_id, booking_date, booking_time, user_name, user_email, user_phone, payment_id, payment_status } = req.body;
    if (!business_id || !service_id || !booking_date || !booking_time || !user_name) {
        return next(createAppError('Missing required fields', 400));
    }
    // Fetch service details for name, duration, price
    getServiceById(service_id, (err, service) => {
        if (err || !service) return next(createAppError('Service not found', 400));
        // Find available staff for this service, date, and time
        getStaffByBusinessAndService(business_id, service_id, async (err, staffList) => {
            if (err || !staffList || staffList.length === 0) return res.status(400).json({ error: 'No staff available for this service' });
            // For each staff, check if they are available at the requested time
            let assignedStaffId = null;
            let assignedStaff = null;
            for (const staff of staffList) {
                // Check if staff works on this day
                const dayName = new Date(booking_date).toLocaleDateString('en-US', { weekday: 'long' });
                if (!staff.working_days.split(',').map(d => d.trim()).includes(dayName)) continue;
                // Check if staff is free at this time
                const bookings = await new Promise(resolve => {
                    getBookingsForStaffOnDate(staff.staff_id, booking_date, (err, rows) => resolve(rows || []));
                });
                // Build busy intervals (start, end+break)
                const addMinutes = (time, mins) => {
                    const [h, m, s] = time.split(':').map(Number);
                    const date = new Date(0, 0, 0, h, m, s || 0);
                    date.setMinutes(date.getMinutes() + mins);
                    return date.toTimeString().slice(0, 5);
                };
                let requestedStart = booking_time;
                let requestedEnd = addMinutes(booking_time, service.duration);
                let overlap = bookings.some(b => {
                    let bStart = b.booking_time;
                    let bEnd = addMinutes(b.booking_time, b.service_duration + 10); // 10 min break
                    return (requestedStart < bEnd && bStart < requestedEnd);
                });
                if (!overlap) {
                    assignedStaffId = staff.staff_id;
                    assignedStaff = staff;
                    break;
                }
            }
            if (!assignedStaffId) {
                return res.status(409).json({ error: 'No staff available for this slot. Please choose another time.' });
            }
            // Create booking with assigned staff
            const bookingData = {
                user_id,
                business_id,
                staff_id: assignedStaffId,
                user_name,
                user_email,
                user_phone,
                service_id,
                service_name: service.name,
                service_duration: service.duration,
                service_price: service.price,
                booking_date,
                booking_time,
                status: 'pending',
                payment_id: payment_id || null,
                payment_status: payment_status || null
            };
            createBooking(bookingData, (err, booking) => {
                if (err) return res.status(500).json({ error: 'Error creating booking' });
                // Send confirmation email to user
                sendMail({
                    to: user_email,
                    toName: user_name,
                    subject: 'Your Salon Booking is Confirmed',
                    text: `Dear ${user_name},\n\nYour booking for ${service.name} at ${booking_date} ${booking_time} is confirmed.\n\nThank you for booking with us!`,
                    html: `<p>Dear ${user_name},</p><p>Your booking for <b>${service.name}</b> at <b>${booking_date} ${booking_time}</b> is confirmed.</p><p>Thank you for booking with us!</p>`
                }).catch(console.error);
                // Send notification email to staff if email exists
                if (assignedStaff && assignedStaff.email) {
                    sendMail({
                        to: assignedStaff.email,
                        toName: assignedStaff.name,
                        subject: 'New Service Booking Assigned',
                        text: `Dear ${assignedStaff.name},\n\nYou have been assigned a new booking for ${service.name} on ${booking_date} at ${booking_time}.\nCustomer: ${user_name}\n\nPlease check your dashboard for details.`,
                        html: `<p>Dear ${assignedStaff.name},</p><p>You have been assigned a new booking for <b>${service.name}</b> on <b>${booking_date} at ${booking_time}</b>.<br>Customer: <b>${user_name}</b></p><p>Please check your dashboard for details.</p>`
                    }).catch(console.error);
                }
                res.json({ message: 'Booking confirmed', booking });
            });
        });
    });
}

function listAppointments(req, res, next) {
    const business_id = req.query.business_id;
    if (!business_id) return next(createAppError('business_id required', 400));
    const status = req.query.status;
    if (!business_id) return res.status(400).json({ error: 'business_id required' });
    let sql = 'SELECT * FROM bookings WHERE business_id = ?';
    let params = [business_id];
    if (status) {
        sql += ' AND status = ?';
        params.push(status);
    } else {
        // By default, only show pending appointments (not completed ones)
        sql += ' AND status != ?';
        params.push('completed');
    }
    sql += ' ORDER BY booking_date, booking_time';
    db.query(sql, params, (err, rows) => {
        if (err) return res.status(500).json({ error: 'Error fetching appointments' });
        res.json({ appointments: rows });
    });
}

function completeAppointment(req, res, next) {
    const booking_id = req.params.id;
    if (!booking_id) return next(createAppError('booking_id required', 400));
    
    db.query('UPDATE bookings SET status = ? WHERE booking_id = ?', ['completed', booking_id], (err, result) => {
        if (err) {
            console.error('Error updating appointment status:', err);
            return res.status(500).json({ error: 'Error updating appointment' });
        }
        
        // Fetch booking details for review email
        getBookingDetailsById(booking_id, (err, booking) => {
            if (err) {
                console.error('Error fetching booking details:', err);
                return res.json({ message: 'Appointment marked as completed, but could not send review email.' });
            }
            
            if (!booking) {
                console.error('Booking not found for ID:', booking_id);
                return res.json({ message: 'Appointment marked as completed, but booking details not found.' });
            }
            
            // Generate a secure token
            const review_token = crypto.randomBytes(24).toString('hex');
            
            // Insert into reviews table (rating will be NULL initially, set when customer submits)
            const reviewSql = `INSERT INTO reviews (booking_id, user_id, staff_id, service_id, review_token) VALUES (?, ?, ?, ?, ?)`;
            db.query(reviewSql, [booking_id, booking.user_id || 0, booking.staff_id, booking.service_id, review_token], (err2) => {
                if (err2) {
                    console.error('Error inserting review record:', err2);
                    // Continue with email sending even if review insert fails
                }
                
                // Send review email
                const reviewLink = `${process.env.BASE_URL || 'http://localhost:3000'}/review/${booking_id}/${review_token}`;
                
                sendMail({
                    to: booking.user_email,
                    toName: booking.user_name,
                    subject: 'How was your salon service? Leave a review!',
                    text: `Dear ${booking.user_name},\n\nYour service is now complete! Please rate your experience: ${reviewLink}`,
                    html: `<p>Dear ${booking.user_name},</p><p>Your service is now complete! Please <a href='${reviewLink}'>click here to rate your experience</a>.</p>`
                }).then(() => {
                    res.json({ message: 'Appointment marked as completed and review email sent.' });
                }).catch((emailErr) => {
                    console.error('Error sending review email:', emailErr);
                    res.json({ message: 'Appointment marked as completed, but review email failed to send.' });
                });
            });
        });
    });
}

function listUserBookings(req, res, next) {
    // ✅ FIX: Get the user's ID securely from the token, not from the 
    const userId = req.user.user_id;

    if (!userId) {
        return next(createAppError('User ID not found in token.', 401));
    }

    // ✅ FIX: Query by user_id instead of user_email.
    const sql = 'SELECT * FROM bookings WHERE user_id = ? ORDER BY booking_date DESC, booking_time DESC';
    
    db.query(sql, [userId], (err, rows) => {
        if (err) return next(createAppError('Error fetching user bookings', 500));
        res.json({ bookings: rows });
    });
}

// GET /api/business-manage/eligible-staff-for-appointment?appointment_id=...
function getEligibleStaffForAppointment(req, res, next) {
    const { appointment_id } = req.query;
    if (!appointment_id) return next(createAppError('appointment_id required', 400));
    // Get the service, business, date, and time for this appointment
    db.query('SELECT service_name, business_id, booking_date, booking_time FROM bookings WHERE booking_id = ?', [appointment_id], (err, rows) => {
        if (err || !rows.length) return res.status(404).json({ error: 'Appointment not found' });
        const { service_name, business_id, booking_date, booking_time } = rows[0];
        // Find staff with this specialization who are not booked at the same date and time
        const sql = `
            SELECT * FROM staff 
            WHERE business_id = ? 
              AND FIND_IN_SET(?, specializations)
              AND staff_id NOT IN (
                SELECT staff_id FROM bookings 
                WHERE booking_date = ? AND booking_time = ? AND status != 'cancelled' AND staff_id IS NOT NULL
              )
        `;
        db.query(sql, [business_id, service_name, booking_date, booking_time], (err, staffRows) => {
            if (err) return res.status(500).json({ error: 'Error fetching staff' });
            res.json({ staff: staffRows });
        });
    });
}

// PUT /api/business-manage/reassign-appointment/:appointment_id
function reassignAppointment(req, res) {
    const { appointment_id } = req.params;
    const { staff_id } = req.body;
    if (!appointment_id || !staff_id) return res.status(400).json({ error: 'appointment_id and staff_id required' });
    // Get booking and staff details
    db.query('SELECT * FROM bookings WHERE booking_id = ?', [appointment_id], (err, bookingRows) => {
        if (err || !bookingRows.length) return res.status(404).json({ error: 'Booking not found' });
        const booking = bookingRows[0];
        db.query('SELECT * FROM staff WHERE staff_id = ?', [staff_id], (err, staffRows) => {
            if (err || !staffRows.length) return res.status(404).json({ error: 'Staff not found' });
            const staff = staffRows[0];
            // Update booking
            db.query('UPDATE bookings SET staff_id = ? WHERE booking_id = ?', [staff_id, appointment_id], (err, result) => {
                if (err) return res.status(500).json({ error: 'Error reassigning appointment' });
                // Send email notification to new staff
                if (staff.email) {
                    const bookingDateStr = new Date(booking.booking_date).toISOString().split('T')[0];
                    sendMail({
                        to: staff.email,
                        toName: staff.name,
                        subject: 'New Appointment Assigned',
                        text: `Dear ${staff.name},\n\nYou have been assigned a new appointment for ${booking.service_name} on ${bookingDateStr} at ${booking.booking_time}.\nCustomer: ${booking.user_name}`,
                        html: `<p>Dear ${staff.name},</p><p>You have been assigned a new appointment for <b>${booking.service_name}</b> on <b>${bookingDateStr} at ${booking.booking_time}</b>.<br>Customer: <b>${booking.user_name}</b></p>`
                    }).catch(console.error);
                }
                res.json({ message: 'Appointment reassigned successfully' });
            });
        });
    });
}

module.exports = {
  addBooking,
  listAppointments,
  completeAppointment,
  listUserBookings,
  getEligibleStaffForAppointment,
  reassignAppointment
};