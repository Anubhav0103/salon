const express = require('express');
const BusinessController = require('../controllers/businessController');
const authenticate = require('../middleware/auth');
const authorizeRoles = require('../middleware/role');
const { validate, schemas } = require('../middleware/validation');

const router = express.Router();

// Public
router.post('/register', validate(schemas.businessRegisterSchema), BusinessController.register);
router.post('/login', validate(schemas.businessLoginSchema), BusinessController.login);

// Protected
router.put('/:id', authenticate, authorizeRoles('business'), validate(schemas.businessUpdateSchema), BusinessController.updateBusiness);
router.get('/', BusinessController.getAllBusinesses);
router.get('/:id', BusinessController.getBusinessById);

module.exports = router;
