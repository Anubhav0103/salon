const { createStaff, getAllStaffByBusiness, getStaffById, updateStaff, deleteStaff } = require('../models/Staff');
const { assignServiceToStaff, removeAllServicesForStaff, getServiceIdByName } = require('../models/StaffService');

function addStaff(req, res) {
    const { business_id, name, email, phone, role, specializations, working_days, working_hours_start, working_hours_end } = req.body;
    if (!business_id || !name || !role || !working_days || !working_hours_start || !working_hours_end) {
        return res.status(400).json({ error: 'Required fields missing' });
    }
    createStaff({ business_id, name, email, phone, role, specializations, working_days, working_hours_start, working_hours_end }, async (err, staff) => {
        if (err) return res.status(500).json({ error: 'Error adding staff' });
        // Populate staff_services table
        if (specializations) {
            const serviceNames = specializations.split(',').map(s => s.trim()).filter(Boolean);
            for (const name of serviceNames) {
                const serviceId = await getServiceIdByName(business_id, name);
                if (serviceId) await assignServiceToStaff(staff.staff_id, serviceId);
            }
        }
        res.status(201).json({ message: 'Staff added', staff });
    });
}

function listStaff(req, res) {
    const business_id = req.query.business_id || req.params.business_id;
    if (!business_id) return res.status(400).json({ error: 'business_id required' });
    getAllStaffByBusiness(business_id, (err, staff) => {
        if (err) return res.status(500).json({ error: 'Error fetching staff' });
        res.json({ staff });
    });
}

function getStaff(req, res) {
    const { id } = req.params;
    getStaffById(id, (err, staff) => {
        if (err) return res.status(500).json({ error: 'Error fetching staff' });
        if (!staff) return res.status(404).json({ error: 'Staff not found' });
        res.json({ staff });
    });
}

function editStaff(req, res) {
    const { id } = req.params;
    const { name, email, phone, role, specializations, working_days, working_hours_start, working_hours_end } = req.body;
    updateStaff(id, { name, email, phone, role, specializations, working_days, working_hours_start, working_hours_end }, async (err, updated) => {
        if (err) return res.status(500).json({ error: 'Error updating staff' });
        // Update staff_services table
        await removeAllServicesForStaff(id);
        if (specializations) {
            const business_id = updated.business_id;
            const serviceNames = specializations.split(',').map(s => s.trim()).filter(Boolean);
            for (const name of serviceNames) {
                const serviceId = await getServiceIdByName(business_id, name);
                if (serviceId) await assignServiceToStaff(id, serviceId);
            }
        }
        res.json({ message: 'Staff updated', staff: updated });
    });
}

function removeStaff(req, res) {
    const { id } = req.params;
    removeAllServicesForStaff(id, (err) => {
        if (err) {
            console.error('Error removing staff services:', err);
            return res.status(500).json({ error: 'Error deleting staff services: ' + err.message });
        }
        deleteStaff(id, (err, result) => {
            if (err) {
                console.error('Error deleting staff:', err);
                // Provide more detailed error message
                return res.status(500).json({ error: 'Error deleting staff: ' + err.message });
            }
            res.json({ message: 'Staff deleted successfully' });
        });
    });
}

module.exports = {
    addStaff,
    listStaff,
    getStaff,
    editStaff,
    removeStaff
}; 