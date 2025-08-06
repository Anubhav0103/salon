const Business = require('../models/Business');
const fetch = require('node-fetch');
const { createAppError } = require('../middleware/errorHandler');

async function geocodeAddress(address) {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`;
    const res = await fetch(url, { headers: { 'User-Agent': 'salon-app/1.0' } });
    const data = await res.json();
    if (data && data.length > 0) {
        return {
            latitude: parseFloat(data[0].lat),
            longitude: parseFloat(data[0].lon)
        };
    }
    return { latitude: null, longitude: null };
}

async function register(req, res, next) {
    const { salon_name, salon_address, email, phone, password } = req.body;
    if (!salon_name || !salon_address || !email || !phone || !password) {
        return next(createAppError('All fields are required', 400));
    }
    if (password.length < 6) {
        return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }
    Business.findByEmail(email, async (err, existingBusiness) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        if (existingBusiness) return res.status(400).json({ error: 'Email already registered' });

        let coords = await geocodeAddress(salon_address);
        Business.create({ salon_name, salon_address, email, phone, password, latitude: coords.latitude, longitude: coords.longitude }, (err, business) => {
            if (err) return res.status(500).json({ error: 'Error creating business' });

            const jwt = require('jsonwebtoken');
            const JWT_SECRET = process.env.JWT_SECRET;
            const payload = {
                business_id: business.business_id,
                salon_name: business.salon_name,
                email: business.email,
                role: 'business'
            };
            const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });

            res.status(201).json({
                message: 'Business registered successfully',
                token
            });
        });
    });
}


function getAllBusinesses(req, res) {
    Business.getAll((err, businesses) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        res.json({ businesses });
    });
}

function getBusinessById(req, res) {
    const businessId = req.params.id;
    Business.findById(businessId, (err, business) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        if (!business) return res.status(404).json({ error: 'Business not found' });
        res.json({ business });
    });
}

function login(req, res) {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
    }

    Business.findByEmail(email, (err, business) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        if (!business) return res.status(401).json({ error: 'Invalid email or password' });

        Business.verifyPassword(password, business.password, (err, isMatch) => {
            if (err) return res.status(500).json({ error: 'Error verifying password' });
            if (!isMatch) return res.status(401).json({ error: 'Invalid email or password' });

            const jwt = require('jsonwebtoken');
            const JWT_SECRET = process.env.JWT_SECRET;
            const payload = {
                business_id: business.business_id,
                salon_name: business.salon_name,
                email: business.email,
                role: 'business'
            };
            const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });

            res.status(200).json({
                message: 'Login successful',
                token
            });
        });
    });
}


async function updateBusiness(req, res) {
    const businessId = req.params.id;
    const { salon_name, salon_address, email, phone } = req.body;
    if (!salon_name || !salon_address || !email || !phone) {
        return res.status(400).json({ error: 'All fields are required' });
    }
    // Geocode address
    let coords = await geocodeAddress(salon_address);
    Business.update(businessId, { salon_name, salon_address, email, phone, latitude: coords.latitude, longitude: coords.longitude }, (err, business) => {
        if (err) return res.status(500).json({ error: 'Error updating business' });
        res.json({
            message: 'Business updated successfully',
            business: {
                ...business,
                latitude: coords.latitude,
                longitude: coords.longitude
            }
        });
    });
}

module.exports = {
    register,
    getAllBusinesses,
    getBusinessById,
    login,
    updateBusiness
};