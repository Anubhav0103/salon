const { createStaff, getAllStaffByBusiness, getStaffById, updateStaff, deleteStaff } = require('../models/Staff');
const { assignServiceToStaff, removeAllServicesForStaff, getServiceIdByName } = require('../models/StaffService');
const { createAppError } = require('../middleware/errorHandler');

// ... (addStaff, listStaff, getStaff functions remain the same) ...
function addStaff(req, res, next) {
    const { business_id, name, email, phone, role, specializations, working_days, working_hours_start, working_hours_end } = req.body;
    if (!business_id || !name || !role || !working_days || !working_hours_start || !working_hours_end) {
        return next(createAppError('Required fields missing', 400));
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


// FIXED editStaff function
function editStaff(req, res) {
    const { id } = req.params;
    // FIX: Grab business_id directly from the request body.
    const { business_id, name, email, phone, role, specializations, working_days, working_hours_start, working_hours_end } = req.body;

    // Pass all fields except business_id to updateStaff model function.
    const staffData = { name, email, phone, role, specializations, working_days, working_hours_start, working_hours_end };

    updateStaff(id, staffData, async (err, updated) => {
        if (err) return res.status(500).json({ error: 'Error updating staff' });

        // Update staff_services table
        await removeAllServicesForStaff(id); // Clear old assignments

        if (specializations) {
            const serviceNames = specializations.split(',').map(s => s.trim()).filter(Boolean);
            for (const name of serviceNames) {
                // FIX: Use the business_id captured from the request body.
                const serviceId = await getServiceIdByName(business_id, name);
                if (serviceId) {
                    await assignServiceToStaff(id, serviceId);
                } else {
                    console.warn(`Service with name "${name}" not found for business ${business_id}`);
                }
            }
        }
        res.json({ message: 'Staff updated', staff: updated });
    });
}

// SIMPLIFIED removeStaff function
function removeStaff(req, res) {
    const { id } = req.params;
    // The deleteStaff model already handles removing assignments from staff_services.
    // No need to call removeAllServicesForStaff here.
    deleteStaff(id, (err, result) => {
        if (err) {
            console.error('Error deleting staff:', err);
            // Provide a more detailed error message to the frontend.
            return res.status(500).json({ error: 'Error deleting staff: ' + err.message });
        }
        res.json({ message: 'Staff deleted successfully' });
    });
}

module.exports = {
    addStaff,
    listStaff,
    getStaff,
    editStaff,
    removeStaff
};