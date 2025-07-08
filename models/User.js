const db = require('../config/database');
const bcrypt = require('bcryptjs');

function create(userData, callback) {
    const { name, email, phone, password } = userData;
    bcrypt.hash(password, 10, (err, hashedPassword) => {
        if (err) return callback(err);
        const sql = `INSERT INTO users (name, email, phone, password) VALUES (?, ?, ?, ?)`;
        db.query(sql, [name, email, phone, hashedPassword], (err, result) => {
            if (err) return callback(err);
            callback(null, { user_id: result.insertId, name, email, phone });
        });
    });
}

function findByEmail(email, callback) {
    const sql = `SELECT * FROM users WHERE email = ?`;
    db.query(sql, [email], (err, rows) => {
        if (err) return callback(err);
        callback(null, rows[0]);
    });
}

function findById(userId, callback) {
    const sql = `SELECT user_id, name, email, phone, created_at FROM users WHERE user_id = ?`;
    db.query(sql, [userId], (err, rows) => {
        if (err) return callback(err);
        callback(null, rows[0]);
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
    findByEmail,
    findById,
    verifyPassword
}; 