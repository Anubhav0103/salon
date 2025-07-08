const db = require('../config/database');

function assignServiceToStaff(staff_id, service_id, callback) {
    const sql = `INSERT INTO staff_services (staff_id, service_id) VALUES (?, ?)`;
    if (callback) {
        db.query(sql, [staff_id, service_id], (err, result) => {
            callback(err, { staff_id, service_id });
        });
    } else {
        return new Promise((resolve, reject) => {
            db.query(sql, [staff_id, service_id], (err, result) => {
                if (err) return reject(err);
                resolve({ staff_id, service_id });
            });
        });
    }
}

function unassignServiceFromStaff(staff_id, service_id, callback) {
    const sql = `DELETE FROM staff_services WHERE staff_id = ? AND service_id = ?`;
    db.query(sql, [staff_id, service_id], (err, result) => {
        if (err) return callback(err);
        callback(null, { staff_id, service_id });
    });
}

function getServicesByStaff(staff_id, callback) {
    const sql = `SELECT s.* FROM services s JOIN staff_services ss ON s.service_id = ss.service_id WHERE ss.staff_id = ?`;
    db.query(sql, [staff_id], (err, rows) => {
        if (err) return callback(err);
        callback(null, rows);
    });
}

function getStaffByService(service_id, callback) {
    const sql = `SELECT st.* FROM staff st JOIN staff_services ss ON st.staff_id = ss.staff_id WHERE ss.service_id = ?`;
    db.query(sql, [service_id], (err, rows) => {
        if (err) return callback(err);
        callback(null, rows);
    });
}

function removeAllServicesForStaff(staff_id, callback) {
    const sql = `DELETE FROM staff_services WHERE staff_id = ?`;
    db.query(sql, [staff_id], (err, result) => {
        if (callback) callback(err, result);
    });
}

function getServiceIdByName(business_id, name) {
    return new Promise((resolve, reject) => {
        const sql = `SELECT service_id FROM services WHERE business_id = ? AND name = ? LIMIT 1`;
        db.query(sql, [business_id, name], (err, rows) => {
            if (err) return resolve(null);
            if (rows && rows.length > 0) resolve(rows[0].service_id);
            else resolve(null);
        });
    });
}

module.exports = {
    assignServiceToStaff,
    unassignServiceFromStaff,
    getServicesByStaff,
    getStaffByService,
    removeAllServicesForStaff,
    getServiceIdByName
}; 