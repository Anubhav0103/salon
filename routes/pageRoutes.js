const express = require('express');
const path = require('path');
const router = express.Router();

// Page routes
router.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../views', 'index.html'));
});

router.get('/user-login', (req, res) => {
    res.sendFile(path.join(__dirname, '../views', 'user-login.html'));
});

router.get('/user-signup', (req, res) => {
    res.sendFile(path.join(__dirname, '../views', 'user-signup.html'));
});

router.get('/business-login', (req, res) => {
    res.sendFile(path.join(__dirname, '../views', 'business-login.html'));
});

router.get('/business-signup', (req, res) => {
    res.sendFile(path.join(__dirname, '../views', 'business-signup.html'));
});

// Dashboard routes (placeholder)
router.get('/dashboard', (req, res) => {
    res.send(`
        <html>
            <head><title>User Dashboard</title></head>
            <body>
                <h1>User Dashboard</h1>
                <p>Welcome to your dashboard!</p>
                <button onclick="logout()">Logout</button>
                <script>
                    function logout() {
                        localStorage.removeItem('token');
                        localStorage.removeItem('user');
                        window.location.href = '/';
                    }
                </script>
            </body>
        </html>
    `);
});

router.get('/business-dashboard', (req, res) => {
    res.send(`
        <html>
            <head><title>Business Dashboard</title></head>
            <body>
                <h1>Business Dashboard</h1>
                <p>Welcome to your business dashboard!</p>
                <ul>
                    <li><a href="/business-services.html">Manage Services</a></li>
                    <li><a href="/business-staff.html">Manage Staff</a></li>
                    <li><a href="/business-staff-services.html">Assign Services to Staff</a></li>
                    <li><a href="/business-appointments.html">Manage Appointments</a></li>
                    <li><a href="/business-ratings.html">View Staff Ratings</a></li>
                </ul>
                <a href="/">Back to Home</a>
            </body>
        </html>
    `);
});

// Add business staff management route
router.get('/business-staff', (req, res) => {
    res.sendFile(path.join(__dirname, '../views', 'business-staff.html'));
});

// Add business services management route
router.get('/business-services', (req, res) => {
    res.sendFile(path.join(__dirname, '../views', 'business-services.html'));
});

// Add booking/search page for users
router.get('/book', (req, res) => {
    res.sendFile(path.join(__dirname, '../views', 'book.html'));
});

// Add business appointments management route
router.get('/business-appointments', (req, res) => {
    res.sendFile(path.join(__dirname, '../views', 'business-appointments.html'));
});

// Add user dashboard route
router.get('/user-dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, '../views', 'user-dashboard.html'));
});

// Add business ratings route
router.get('/business-ratings', (req, res) => {
    res.sendFile(path.join(__dirname, '../views', 'business-ratings.html'));
});

module.exports = router; 