const db = require('../config/database');

function createBooking(bookingData, callback) {
    const {
        business_id, staff_id, user_name, user_email, user_phone,
        service_id, service_name, service_duration, service_price,
        booking_date, booking_time, status, payment_id, payment_status
    } = bookingData;
    const sql = `INSERT INTO bookings (
        business_id, staff_id, user_name, user_email, user_phone,
        service_id, service_name, service_duration, service_price,
        booking_date, booking_time, status, payment_id, payment_status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    db.query(sql, [
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

module.exports = {
    createBooking,
    getBookingsForStaffOnDate
}; 