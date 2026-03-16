const express = require('express');
const contactController = require('../controllers/contactController');
const { protect, restrictTo } = require('../middleware/authMiddlewares');

const router = express.Router();

// Public routes
router.post('/submit', contactController.submitContact);


module.exports = router;