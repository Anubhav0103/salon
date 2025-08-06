const User = require('../models/User');
const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET;
const { createAppError } = require('../middleware/errorHandler');

function register(req, res, next) {
    try {
        const { name, email, phone, password } = req.body;
        if (!name || !email || !phone || !password) {
            return next(createAppError('All fields are required', 400));
        }

        if (password.length < 4) {
            return next(createAppError('Password must be at least 4 characters', 400));
        }

        User.findByEmail(email, (err, existingUser) => {
            if (err) return next(createAppError('Database error', 500));
            if (existingUser) return next(createAppError('Email already registered', 400));

            User.create({ name, email, phone, password }, (err, user) => {
                if (err) return next(createAppError('Error creating user', 500));
                const token = jwt.sign(
                    { user_id: user.user_id, name: user.name, email: user.email, phone: user.phone, role: 'user' },
                    JWT_SECRET,
                    { expiresIn: '24h' }
                );
                res.status(201).json({ message: 'User registered successfully', token });
            });
        });

    } catch (error) {
        return next(error);
    }
}

// In controllers/userController.js

function login(req, res, next) {
    // The try...catch is good for synchronous errors
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return next(createAppError('Email and password are required', 400));
        }

        User.findByEmail(email, (err, user) => {
            // Handle potential database errors first
            if (err) return next(createAppError('Database error', 500));
            if (!user) return next(createAppError('Invalid email or password', 401));

            User.verifyPassword(password, user.password, (err, isMatch) => {
                // ✅ FIX: Handle potential errors from the bcrypt comparison itself.
                if (err) return next(createAppError('Error verifying password', 500));
                
                // If passwords do not match, send a clear error
                if (!isMatch) return next(createAppError('Invalid email or password', 401));

                // If everything is successful, create and send the token
                const token = jwt.sign(
                    { user_id: user.user_id, name: user.name, email: user.email, phone: user.phone, role: 'user' },
                    JWT_SECRET,
                    { expiresIn: '24h' }
                );
                res.status(200).json({ message: 'Login successful', token });
            });
        });
    } catch (error) {
        // This will catch any synchronous errors that might occur
        return next(error);
    }
}

function getProfile(req, res, next) {
    try {
        const userId = req.user.userId;
        User.findById(userId, (err, user) => {
            if (err) return next(createAppError('Database error', 500));
            if (!user) return next(createAppError('User not found', 404));
            res.json({ user });
        });
    } catch (error) {
        return next(error);
    }
}

module.exports = {
    register,
    login,
    getProfile
};
