const { assignServiceToStaff, unassignServiceFromStaff, getServicesByStaff, getStaffByService } = require('../models/StaffService');

function assignService(req, res) {
    const { staff_id, service_id } = req.body;
    if (!staff_id || !service_id) return res.status(400).json({ error: 'staff_id and service_id required' });
    assignServiceToStaff(staff_id, service_id, (err, result) => {
        if (err) return res.status(500).json({ error: 'Error assigning service' });
        res.json({ message: 'Service assigned to staff', assignment: result });
    });
}

function unassignService(req, res) {
    const { staff_id, service_id } = req.body;
    if (!staff_id || !service_id) return res.status(400).json({ error: 'staff_id and service_id required' });
    unassignServiceFromStaff(staff_id, service_id, (err, result) => {
        if (err) return res.status(500).json({ error: 'Error unassigning service' });
        res.json({ message: 'Service unassigned from staff', assignment: result });
    });
}

function listServicesForStaff(req, res) {
    const { staff_id } = req.query;
    if (!staff_id) return res.status(400).json({ error: 'staff_id required' });
    getServicesByStaff(staff_id, (err, services) => {
        if (err) return res.status(500).json({ error: 'Error fetching services for staff' });
        res.json({ services });
    });
}

function listStaffForService(req, res) {
    const { service_id } = req.query;
    if (!service_id) return res.status(400).json({ error: 'service_id required' });
    getStaffByService(service_id, (err, staff) => {
        if (err) return res.status(500).json({ error: 'Error fetching staff for service' });
        res.json({ staff });
    });
}

module.exports = {
    assignService,
    unassignService,
    listServicesForStaff,
    listStaffForService
}; 