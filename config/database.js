const mysql = require('mysql2');

// Database configuration
const dbConfig = {
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'salon_booking',
    port: 3306
};

// Create database connection
const db = mysql.createConnection(dbConfig);

// Connect to database
db.connect((err) => {
    if (err) {
        console.error('Error connecting to MySQL database:', err.message);
    } else {
        console.log('Connected to MySQL database successfully.');
    }
});

module.exports = db; 