const db = require('../config/database');

function createStaff(staffData, callback) {
    const { business_id, name, email, phone, role, specializations, working_days, working_hours_start, working_hours_end } = staffData;
    const sql = `INSERT INTO staff (business_id, name, email, phone, role, specializations, working_days, working_hours_start, working_hours_end) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    db.query(sql, [business_id, name, email, phone, role, specializations, working_days, working_hours_start, working_hours_end], (err, result) => {
        if (err) return callback(err);
        callback(null, { staff_id: result.insertId, ...staffData });
    });
}

function getAllStaffByBusiness(business_id, callback) {
    const sql = `SELECT * FROM staff WHERE business_id = ? ORDER BY created_at DESC`;
    db.query(sql, [business_id], (err, rows) => {
        if (err) return callback(err);
        callback(null, rows);
    });
}

function getStaffById(staff_id, callback) {
    const sql = `SELECT * FROM staff WHERE staff_id = ?`;
    db.query(sql, [staff_id], (err, rows) => {
        if (err) return callback(err);
        callback(null, rows[0]);
    });
}

function updateStaff(staff_id, staffData, callback) {
    const { name, email, phone, role, specializations, working_days, working_hours_start, working_hours_end } = staffData;
    const sql = `UPDATE staff SET name = ?, email = ?, phone = ?, role = ?, specializations = ?, working_days = ?, working_hours_start = ?, working_hours_end = ? WHERE staff_id = ?`;
    db.query(sql, [name, email, phone, role, specializations, working_days, working_hours_start, working_hours_end, staff_id], (err, result) => {
        if (err) return callback(err);
        callback(null, { staff_id, ...staffData });
    });
}

function deleteStaff(staff_id, callback) {
    // Only block if there are appointments with status not 'completed' and date >= today
    const checkSql = `SELECT COUNT(*) as pending_count FROM bookings WHERE staff_id = ? AND (status != 'completed' AND booking_date >= CURDATE())`;
    db.query(checkSql, [staff_id], (err, rows) => {
        if (err) {
            console.error('Error checking pending bookings:', err);
            return callback(err);
        }
        const pendingCount = rows[0].pending_count;
        if (pendingCount > 0) {
            return callback(new Error('Cannot delete staff: There are pending or future appointments assigned. Please reassign or complete them first.'));
        }
        // Remove staff_services entries first
        const removeServicesSql = `DELETE FROM staff_services WHERE staff_id = ?`;
        db.query(removeServicesSql, [staff_id], (err) => {
            if (err) {
                console.error('Error removing staff services:', err);
                return callback(err);
            }
            // Remove reviews for this staff
            const removeReviewsSql = `DELETE FROM reviews WHERE staff_id = ?`;
            db.query(removeReviewsSql, [staff_id], (err) => {
                if (err) {
                    console.error('Error removing staff reviews:', err);
                    return callback(err);
                }
                // Then delete the staff
                const deleteSql = `DELETE FROM staff WHERE staff_id = ?`;
                db.query(deleteSql, [staff_id], (err, result) => {
                    if (err) {
                        console.error('Error deleting staff:', err);
                        return callback(err);
                    }
                    callback(null, { staff_id });
                });
            });
        });
    });
}

function getStaffByBusinessAndService(business_id, service_id, callback) {
    const sql = `SELECT st.* FROM staff st JOIN staff_services ss ON st.staff_id = ss.staff_id WHERE st.business_id = ? AND ss.service_id = ?`;
    db.query(sql, [business_id, service_id], (err, rows) => {
        if (err) return callback(err);
        callback(null, rows);
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
    createStaff,
    getAllStaffByBusiness,
    getStaffById,
    updateStaff,
    deleteStaff,
    getStaffByBusinessAndService,
    getBookingsForStaffOnDate
}; 