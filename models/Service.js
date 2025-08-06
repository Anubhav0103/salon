const db = require('../config/database');

function createService(serviceData, callback) {
    console.log("--- [MODEL LOG 1] --- createService function has been called.");
    const { business_id, name, description, duration, price } = serviceData;
    const sql = `INSERT INTO services (business_id, name, description, duration, price) VALUES (?, ?, ?, ?, ?)`;
    
    console.log("--- [MODEL LOG 2] --- About to execute SQL query:", sql);
    
    db.query(sql, [business_id, name, description, duration, price], (err, result) => {
        console.log("--- [MODEL LOG 3] --- The database has responded to the query.");
        if (err) {
            console.error("--- [MODEL LOG 4 - DB ERROR] ---", err);
            return callback(err);
        }
        
        console.log("--- [MODEL LOG 5 - DB SUCCESS] --- Query successful.");
        callback(null, { service_id: result.insertId, ...serviceData });
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
    // First check if service is being used in bookings
    const checkSql = `SELECT COUNT(*) as booking_count FROM bookings WHERE service_id = ?`;
    
    db.query(checkSql, [service_id], (err, rows) => {
        if (err) return callback(err);
        
        const bookingCount = rows[0].booking_count;
        if (bookingCount > 0) {
            return callback(new Error(`Cannot delete service. It is being used by ${bookingCount} booking(s).`));
        }
        
        // Get service name before deletion
        const getServiceSql = `SELECT name FROM services WHERE service_id = ?`;
        db.query(getServiceSql, [service_id], (err, serviceRows) => {
            if (err) return callback(err);
            
            if (serviceRows.length === 0) {
                return callback(new Error('Service not found'));
            }
            
            const serviceName = serviceRows[0].name;
            
            // Remove service from staff_services table
            const removeStaffServiceSql = `DELETE FROM staff_services WHERE service_id = ?`;
            db.query(removeStaffServiceSql, [service_id], (err) => {
                if (err) return callback(err);
                
                // Update staff specializations to remove this service
                const updateStaffSql = `
                    UPDATE staff 
                    SET specializations = TRIM(BOTH ',' FROM REPLACE(CONCAT(',', specializations, ','), CONCAT(',', ?, ','), ','))
                    WHERE specializations LIKE CONCAT('%', ?, '%')
                `;
                db.query(updateStaffSql, [serviceName, serviceName], (err) => {
                    if (err) return callback(err);
                    
                    // Finally delete the service
                    const deleteSql = `DELETE FROM services WHERE service_id = ?`;
                    db.query(deleteSql, [service_id], (err, result) => {
                        if (err) return callback(err);
                        callback(null, { service_id, serviceName });
                    });
                });
            });
        });
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