const User = require('../models/User');
const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET;

function register(req, res) {
    const { name, email, phone, password } = req.body;
    if (!name || !email || !phone || !password) {
        return res.status(400).json({ error: 'All fields are required' });
    }
    if (password.length < 4) {
        return res.status(400).json({ error: 'Password must be at least 4 characters' });
    }
    User.findByEmail(email, (err, existingUser) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        if (existingUser) return res.status(400).json({ error: 'Email already registered' });
        User.create({ name, email, phone, password }, (err, user) => {
            if (err) return res.status(500).json({ error: 'Error creating user' });
            const token = jwt.sign({ user_id: user.user_id, name: user.name, email: user.email, phone: user.phone }, JWT_SECRET, { expiresIn: '24h' });
            res.status(201).json({
                message: 'User registered successfully',
                token
            });
        });
    });
}

function login(req, res) {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
    }
    User.findByEmail(email, (err, user) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        if (!user) return res.status(401).json({ error: 'Invalid email or password' });
        User.verifyPassword(password, user.password, (err, isMatch) => {
            if (err) return res.status(500).json({ error: 'Error verifying password' });
            if (!isMatch) return res.status(401).json({ error: 'Invalid email or password' });
            const token = jwt.sign({ user_id: user.user_id, name: user.name, email: user.email, phone: user.phone }, JWT_SECRET, { expiresIn: '24h' });
            res.json({
                message: 'Login successful',
                token
            });
        });
    });
}

function getProfile(req, res) {
    const userId = req.user.userId;
    User.findById(userId, (err, user) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        if (!user) return res.status(404).json({ error: 'User not found' });
        res.json({ user });
    });
}

module.exports = {
    register,
    login,
    getProfile
}; 