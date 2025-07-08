const db = require('../config/database');

function createService(serviceData, callback) {
    const { business_id, name, description, duration, price } = serviceData;
    const sql = `INSERT INTO services (business_id, name, description, duration, price) VALUES (?, ?, ?, ?, ?)`;
    db.query(sql, [business_id, name, description, duration, price], (err, result) => {
        if (err) return callback(err);
        callback(null, { service_id: result.insertId, business_id, name, description, duration, price });
    });
}

function getAllServicesByBusiness(business_id, callback) {
    const sql = `SELECT * FROM services WHERE business_id = ? ORDER BY created_at DESC`;
    db.query(sql, [business_id], (err, rows) => {
        if (err) return callback(err);
        callback(null, rows);
    });
}

function getServiceById(service_id, callback) {
    const sql = `SELECT * FROM services WHERE service_id = ?`;
    db.query(sql, [service_id], (err, rows) => {
        if (err) return callback(err);
        callback(null, rows[0]);
    });
}

function updateService(service_id, serviceData, callback) {
    const { name, description, duration, price } = serviceData;
    const sql = `UPDATE services SET name = ?, description = ?, duration = ?, price = ? WHERE service_id = ?`;
    db.query(sql, [name, description, duration, price, service_id], (err, result) => {
        if (err) return callback(err);
        callback(null, { service_id, ...serviceData });
    });
}

function deleteService(service_id, callback) {
    const sql = `DELETE FROM services WHERE service_id = ?`;
    db.query(sql, [service_id], (err, result) => {
        if (err) return callback(err);
        callback(null, { service_id });
    });
}

function getAllUniqueServices(callback) {
    const sql = `SELECT DISTINCT name, service_id FROM services ORDER BY name ASC`;
    db.query(sql, [], (err, rows) => {
        if (err) return callback(err);
        callback(null, rows);
    });
}

function getAllCatalogServices(callback) {
    const sql = `SELECT catalog_service_id, name FROM service_catalog ORDER BY name ASC`;
    db.query(sql, [], (err, rows) => {
        if (err) return callback(err);
        callback(null, rows);
    });
}

function getServiceDurationAndPrice(service_id, callback) {
    const sql = `SELECT duration, price FROM services WHERE service_id = ?`;
    db.query(sql, [service_id], (err, rows) => {
        if (err) return callback(err);
        callback(null, rows[0]);
    });
}

module.exports = {
    createService,
    getAllServicesByBusiness,
    getServiceById,
    updateService,
    deleteService,
    getAllUniqueServices,
    getAllCatalogServices,
    getServiceDurationAndPrice
}; 