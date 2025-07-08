const { createService, getAllServicesByBusiness, getServiceById, updateService, deleteService, getAllUniqueServices, getAllCatalogServices } = require('../models/Service');

function addService(req, res) {
    const { business_id, name, description, duration, price } = req.body;
    if (!business_id || !name || !duration || !price) {
        return res.status(400).json({ error: 'Required fields missing' });
    }
    createService({ business_id, name, description, duration, price }, (err, service) => {
        if (err) return res.status(500).json({ error: 'Error adding service' });
        res.status(201).json({ message: 'Service added', service });
    });
}

function listServices(req, res) {
    const business_id = req.query.business_id || req.params.business_id;
    if (!business_id) return res.status(400).json({ error: 'business_id required' });
    getAllServicesByBusiness(business_id, (err, services) => {
        if (err) return res.status(500).json({ error: 'Error fetching services' });
        res.json({ services });
    });
}

function getService(req, res) {
    const { id } = req.params;
    getServiceById(id, (err, service) => {
        if (err) return res.status(500).json({ error: 'Error fetching service' });
        if (!service) return res.status(404).json({ error: 'Service not found' });
        res.json({ service });
    });
}

function editService(req, res) {
    const { id } = req.params;
    const { name, description, duration, price } = req.body;
    updateService(id, { name, description, duration, price }, (err, updated) => {
        if (err) return res.status(500).json({ error: 'Error updating service' });
        res.json({ message: 'Service updated', service: updated });
    });
}

function removeService(req, res) {
    const { id } = req.params;
    deleteService(id, (err) => {
        if (err) return res.status(500).json({ error: 'Error deleting service' });
        res.json({ message: 'Service deleted' });
    });
}

function listAllUniqueServices(req, res) {
    getAllUniqueServices((err, services) => {
        if (err) return res.status(500).json({ error: 'Error fetching services' });
        res.json({ services });
    });
}

function listCatalogServices(req, res) {
    getAllCatalogServices((err, services) => {
        if (err) return res.status(500).json({ error: 'Error fetching catalog services' });
        res.json({ services });
    });
}

module.exports = {
    addService,
    listServices,
    getService,
    editService,
    removeService,
    listAllUniqueServices,
    listCatalogServices
}; 