const express = require('express');
const router = express.Router();
const studentController = require('../controllers/studentController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');


router.get('/dashboard', authenticateToken, studentController.getDashboardData);

module.exports = router;