const db = require('../config/database');
const bcrypt = require('bcryptjs');

function create(businessData, callback) {
    const { salon_name, salon_address, email, phone, password, latitude, longitude } = businessData;
    bcrypt.hash(password, 10, (err, hashedPassword) => {
        if (err) return callback(err);
        const sql = `INSERT INTO businesses (salon_name, salon_address, email, phone, password, latitude, longitude) VALUES (?, ?, ?, ?, ?, ?, ?)`;
        db.query(sql, [salon_name, salon_address, email, phone, hashedPassword, latitude, longitude], (err, result) => {
            if (err) return callback(err);
            callback(null, { business_id: result.insertId, salon_name, salon_address, email, phone, latitude, longitude });
        });
    });
}

function findById(businessId, callback) {
    const sql = `SELECT business_id, salon_name, salon_address, email, phone, created_at FROM businesses WHERE business_id = ?`;
    db.query(sql, [businessId], (err, rows) => {
        if (err) return callback(err);
        callback(null, rows[0]);
    });
}

function findByEmail(email, callback) {
    const sql = `SELECT * FROM businesses WHERE email = ?`;
    db.query(sql, [email], (err, rows) => {
        if (err) return callback(err);
        callback(null, rows[0]);
    });
}

function getAll(callback) {
    const sql = `SELECT business_id, salon_name, salon_address, email, phone, created_at FROM businesses ORDER BY created_at DESC`;
    db.query(sql, [], (err, rows) => {
        if (err) return callback(err);
        callback(null, rows);
    });
}

function update(businessId, businessData, callback) {
    const { salon_name, salon_address, email, phone, latitude, longitude } = businessData;
    const sql = `UPDATE businesses SET salon_name = ?, salon_address = ?, email = ?, phone = ?, latitude = ?, longitude = ? WHERE business_id = ?`;
    db.query(sql, [salon_name, salon_address, email, phone, latitude, longitude, businessId], (err, result) => {
        if (err) return callback(err);
        callback(null, { business_id: businessId, salon_name, salon_address, email, phone, latitude, longitude });
    });
}

function verifyPassword(password, hashedPassword, callback) {
    bcrypt.compare(password, hashedPassword, (err, isMatch) => {
        if (err) return callback(err);
        callback(null, isMatch);
    });
}

module.exports = {
    create,
    findById,
    findByEmail,
    getAll,
    update,
    verifyPassword
}; 