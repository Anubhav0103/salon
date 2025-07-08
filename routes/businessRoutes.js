const express = require('express');
const BusinessController = require('../controllers/businessController');
const router = express.Router();

// Business routes
router.post('/register', BusinessController.register);
router.post('/login', BusinessController.login);
router.get('/', BusinessController.getAllBusinesses);
router.get('/:id', BusinessController.getBusinessById);
router.put('/:id', BusinessController.updateBusiness);

module.exports = router; 