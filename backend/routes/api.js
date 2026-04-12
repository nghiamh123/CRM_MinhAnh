const express = require('express');
const router = express.Router();
const customerController = require('../controllers/customerController');
const deviceController = require('../controllers/deviceController');
const rentalController = require('../controllers/rentalController');
const uploadController = require('../controllers/uploadController');


// Customer Routes
router.get('/customers', customerController.getAll);
router.post('/customers', customerController.create);
router.put('/customers/:id', customerController.update);
router.delete('/customers/:id', customerController.remove);

// Device Routes
router.get('/devices', deviceController.getAll);
router.post('/devices', deviceController.create);
router.put('/devices/:id', deviceController.update);
router.delete('/devices/:id', deviceController.remove);

// Rental Routes
router.get('/rentals', rentalController.getAll);
router.post('/rentals', rentalController.create);
router.put('/rentals/:id', rentalController.update);
router.delete('/rentals/:id', rentalController.remove);

// Upload Route
router.post('/upload', uploadController.uploadImage);


module.exports = router;
