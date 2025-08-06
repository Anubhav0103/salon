const db = require('../config/database');

// In models/Booking.js...

function createBooking(bookingData, callback) {
    const {
        // ✅ FIX: Add user_id here
        user_id,
        business_id, staff_id, user_name, user_email, user_phone,
        service_id, service_name, service_duration, service_price,
        booking_date, booking_time, status, payment_id, payment_status
    } = bookingData;

    // ✅ FIX: Add user_id to the INSERT statement fields
    const sql = `INSERT INTO bookings (
        user_id, business_id, staff_id, user_name, user_email, user_phone,
        service_id, service_name, service_duration, service_price,
        booking_date, booking_time, status, payment_id, payment_status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    
    db.query(sql, [
        // ✅ FIX: Add user_id to the values array in the correct position
        user_id,
        business_id, staff_id, user_name, user_email, user_phone,
        service_id, service_name, service_duration, service_price,
        booking_date, booking_time, status, payment_id, payment_status
    ], (err, result) => {
        if (err) return callback(err);
        callback(null, { booking_id: result.insertId, ...bookingData });
    });
}

function getBookingsForStaffOnDate(staff_id, booking_date, callback) {
    const sql = `SELECT * FROM bookings WHERE staff_id = ? AND booking_date = ?`;
    db.query(sql, [staff_id, booking_date], (err, rows) => {
        if (err) return callback(err);
        callback(null, rows);
    });
}

function getBookingDetailsById(booking_id, callback) {
    const sql = `SELECT b.*, s.email as staff_email, s.name as staff_name FROM bookings b LEFT JOIN staff s ON b.staff_id = s.staff_id WHERE b.booking_id = ?`;
    db.query(sql, [booking_id], (err, rows) => {
        if (err) return callback(err);
        callback(null, rows && rows[0]);
    });
}

module.exports = {
    createBooking,
    getBookingsForStaffOnDate,
    getBookingDetailsById
}; 