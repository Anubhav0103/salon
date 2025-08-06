require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const morgan = require('morgan'); // ✅ 1. Import Morgan
const fs = require('fs'); // ✅ 2. Import Node.js File System module

const sanitizeInput = require('./middleware/sanitization');
const errorHandler = require('./middleware/errorHandler');

const pageRoutes = require('./routes/pageRoutes');
const userRoutes = require('./routes/userRoutes');
const businessRoutes = require('./routes/businessRoutes');
const businessManageRoutes = require('./routes/businessManageRoutes');
const reviewRoutes = require('./routes/reviewRoutes');

require('./config/database');
require('./services/cronJobs');

const app = express();
const PORT = process.env.PORT || 3000;

// ✅ 3. Create a write stream (in append mode)
const accessLogStream = fs.createWriteStream(path.join(__dirname, 'logs.txt'), { flags: 'a' });

// ✅ 4. Setup the logger middleware to log to both console and file
app.use(morgan('dev')); // Logs to the console in a developer-friendly format
app.use(morgan('combined', { stream: accessLogStream })); // Logs to the file in a standard format

// Middleware stack
app.use(sanitizeInput);
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));
app.use('/views/js', express.static(path.join(__dirname, 'views/js')));
app.use('/views/style', express.static(path.join(__dirname, 'views/style')));

// Routes
app.use('/', pageRoutes);
app.use('/api/users', userRoutes);
app.use('/api/businesses', businessRoutes);
app.use('/api/business-manage', businessManageRoutes);
app.use('/review', reviewRoutes);

// Global Error Handler (must be last)
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log(`Visit http://localhost:${PORT} to view the application`);
});