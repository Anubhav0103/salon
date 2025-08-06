const { createService, getAllServicesByBusiness, getServiceById, updateService, deleteService, getAllUniqueServices, getAllCatalogServices } = require('../models/Service');
const { createAppError } = require('../middleware/errorHandler');

function addService(req, res, next) {
    console.log("--- [SERVER LOG 1] --- Received request at /services endpoint.");
    const { business_id, name, description, duration, price } = req.body;

    // Validation checks
    if (!business_id || !name || duration === undefined || price === undefined) {
        console.error("--- [SERVER LOG ERROR] --- Validation failed: Missing required fields.");
        return res.status(400).json({ error: 'Required fields are missing: business_id, name, duration, price.' });
    }
    if (typeof business_id !== 'number' || typeof name !== 'string' || typeof duration !== 'number' || typeof price !== 'number') {
        console.error("--- [SERVER LOG ERROR] --- Validation failed: Invalid data types.");
        return res.status(400).json({ error: 'Invalid data types.' });
    }

    console.log("--- [SERVER LOG 2] --- Validation passed. Data is correct. Calling createService in the model...");
    
    // Call the model function
    createService({ business_id, name, description, duration, price }, (err, service) => {
        console.log("--- [SERVER LOG 4] --- Callback from createService has been executed.");
        if (err) {
            console.error("--- [SERVER LOG 5 - ERROR] --- The model returned an error:", err);
            return res.status(500).json({ error: 'Database error while creating service.' });
        }
        
        console.log("--- [SERVER LOG 6 - SUCCESS] --- Service created. Sending success response.");
        res.status(201).json({ message: 'Service added successfully', service });
    });
    
    console.log("--- [SERVER LOG 3] --- Waiting for createService callback to finish.");
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
    deleteService(id, (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        const message = result && result.serviceName 
            ? `Service "${result.serviceName}" deleted successfully. It has been removed from all staff specializations.`
            : 'Service deleted successfully';
        res.json({ message });
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