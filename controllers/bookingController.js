const { createBooking } = require('../models/Booking');
const { getServiceById } = require('../models/Service');
const { getStaffByBusinessAndService, getBookingsForStaffOnDate } = require('../models/Staff');
const db = require('../config/database');
const { sendMail } = require('../utils/mailjet');

function addBooking(req, res) {
    const { business_id, service_id, booking_date, booking_time, user_name, user_email, user_phone, payment_id, payment_status } = req.body;
    if (!business_id || !service_id || !booking_date || !booking_time || !user_name) {
        return res.status(400).json({ error: 'Missing required fields' });
    }
    // Fetch service details for name, duration, price
    getServiceById(service_id, (err, service) => {
        if (err || !service) return res.status(400).json({ error: 'Service not found' });
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

function listAppointments(req, res) {
    const business_id = req.query.business_id;
    const status = req.query.status;
    if (!business_id) return res.status(400).json({ error: 'business_id required' });
    let sql = 'SELECT * FROM bookings WHERE business_id = ?';
    let params = [business_id];
    if (status) {
        sql += ' AND status = ?';
        params.push(status);
    }
    sql += ' ORDER BY booking_date, booking_time';
    db.query(sql, params, (err, rows) => {
        if (err) return res.status(500).json({ error: 'Error fetching appointments' });
        res.json({ appointments: rows });
    });
}

function completeAppointment(req, res) {
    const booking_id = req.params.id;
    if (!booking_id) return res.status(400).json({ error: 'booking_id required' });
    db.query('UPDATE bookings SET status = ? WHERE booking_id = ?', ['completed', booking_id], (err, result) => {
        if (err) return res.status(500).json({ error: 'Error updating appointment' });
        res.json({ message: 'Appointment marked as completed' });
    });
}

function listUserBookings(req, res) {
    const user_email = req.query.user_email;
    if (!user_email) return res.status(400).json({ error: 'user_email required' });
    const sql = 'SELECT * FROM bookings WHERE user_email = ? ORDER BY booking_date DESC, booking_time DESC';
    db.query(sql, [user_email], (err, rows) => {
        if (err) return res.status(500).json({ error: 'Error fetching user bookings' });
        res.json({ bookings: rows });
    });
}

module.exports = { addBooking, listAppointments, completeAppointment, listUserBookings }; 