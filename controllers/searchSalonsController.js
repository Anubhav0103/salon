const db = require('../config/database');
const { getServiceDurationAndPrice } = require('../models/Service');
const { getStaffByBusinessAndService, getBookingsForStaffOnDate } = require('../models/Staff');

function haversine(lat1, lon1, lat2, lon2) {
    function toRad(x) { return x * Math.PI / 180; }
    const R = 6371; // km
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
        Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
}

async function searchSalons(req, res) {
    const { service_names, latitude, longitude } = req.body;
    if (!service_names || !Array.isArray(service_names) || !latitude || !longitude) {
        return res.status(400).json({ error: 'Missing required fields' });
    }
    const placeholders = service_names.map(() => '?').join(',');
    const sql = `
        SELECT b.business_id, b.salon_name, b.salon_address, b.latitude, b.longitude
        FROM businesses b
        JOIN services s ON b.business_id = s.business_id
        WHERE s.name IN (${placeholders})
        GROUP BY b.business_id
        HAVING COUNT(DISTINCT s.name) = ?
    `;
    db.query(sql, [...service_names, service_names.length], (err, rows) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        // Calculate distance for each business
        const salons = rows.map(b => {
            let dist = null;
            if (b.latitude && b.longitude) {
                dist = haversine(latitude, longitude, b.latitude, b.longitude);
            }
            return { ...b, distance: dist };
        }).filter(b => b.distance !== null);
        salons.sort((a, b) => a.distance - b.distance);
        res.json({ salons });
    });
}

async function searchSalonsWithDate(req, res) {
    const { service_names, latitude, longitude, booking_date, day_name } = req.body;
    if (!service_names || !Array.isArray(service_names) || !latitude || !longitude || !booking_date || !day_name) {
        return res.status(400).json({ error: 'Missing required fields' });
    }
    // Only support one service for price display
    const selectedService = service_names[0];
    const placeholders = service_names.map(() => '?').join(',');
    const sql = `
        SELECT DISTINCT b.business_id, b.salon_name, b.salon_address, b.latitude, b.longitude,
               GROUP_CONCAT(DISTINCT st.working_days) as staff_working_days,
               s.price as service_price
        FROM businesses b
        JOIN services s ON b.business_id = s.business_id
        JOIN staff st ON b.business_id = st.business_id
        WHERE s.name IN (${placeholders})
        AND FIND_IN_SET(?, st.working_days) > 0
        GROUP BY b.business_id
        HAVING COUNT(DISTINCT s.name) = ?
    `;
    db.query(sql, [...service_names, day_name, service_names.length], (err, rows) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        const salons = rows.map(b => {
            let dist = null;
            if (b.latitude && b.longitude) {
                dist = haversine(latitude, longitude, b.latitude, b.longitude);
            }
            return {
                ...b,
                distance: dist,
                is_available: true,
                staff_working_days: b.staff_working_days,
                service_price: b.service_price
            };
        }).filter(b => b.distance !== null);
        salons.sort((a, b) => a.distance - b.distance);
        res.json({ salons });
    });
}

// Utility to add minutes to a time string (HH:MM:SS)
function addMinutes(time, mins) {
    const [h, m, s] = time.split(':').map(Number);
    const date = new Date(0, 0, 0, h, m, s || 0);
    date.setMinutes(date.getMinutes() + mins);
    return date.toTimeString().slice(0, 5);
}

// Check if two time intervals overlap
function isOverlap(start1, end1, start2, end2) {
    return (start1 < end2 && start2 < end1);
}

// Main function to get available slots
async function getAvailableSlots(req, res) {
    const { business_id, service_id, booking_date } = req.body;
    if (!business_id || !service_id || !booking_date) {
        return res.status(400).json({ error: 'Missing required fields' });
    }
    // 1. Get service duration
    getServiceDurationAndPrice(service_id, async (err, service) => {
        if (err || !service) return res.status(500).json({ error: 'Service not found' });
        const duration = service.duration;
        // 2. Get all staff for this business who can do this service
        getStaffByBusinessAndService(business_id, service_id, async (err, staffList) => {
            if (err || !staffList || staffList.length === 0) return res.status(404).json({ error: 'No staff available for this service' });
            // 3. For each staff, build their available slots
            let allSlots = {};
            for (const staff of staffList) {
                // Only if staff works on this day
                const dayName = new Date(booking_date).toLocaleDateString('en-US', { weekday: 'long' });
                if (!staff.working_days.split(',').map(d => d.trim()).includes(dayName)) continue;
                let slots = [];
                let start = staff.working_hours_start;
                let end = staff.working_hours_end;
                // 4. Get all bookings for this staff on this date
                await new Promise(resolve => {
                    getBookingsForStaffOnDate(staff.staff_id, booking_date, (err, bookings) => {
                        // Build a list of busy intervals (start, end+break)
                        let busy = (bookings || []).map(b => {
                            let bStart = b.booking_time;
                            let bEnd = addMinutes(b.booking_time, b.service_duration + 10); // 10 min break
                            return { start: bStart, end: bEnd };
                        });
                        // Generate slots
                        let t = start;
                        while (addMinutes(t, duration) <= end) {
                            let tEnd = addMinutes(t, duration);
                            // Check overlap with any busy interval
                            let overlap = busy.some(b => isOverlap(t, tEnd, b.start, b.end));
                            if (!overlap) slots.push(t);
                            t = addMinutes(t, 10); // Try every 10 min for flexibility
                        }
                        allSlots[staff.staff_id] = slots;
                        resolve();
                    });
                });
            }
            // Aggregate: a slot is available if at least one staff is free
            let slotCounts = {};
            Object.values(allSlots).forEach(slots => {
                slots.forEach(s => { slotCounts[s] = (slotCounts[s] || 0) + 1; });
            });
            let availableSlots = Object.keys(slotCounts).sort();
            res.json({ slots: availableSlots });
        });
    });
}

module.exports = { searchSalons, searchSalonsWithDate, getAvailableSlots }; 