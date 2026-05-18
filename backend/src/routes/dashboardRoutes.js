const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

router.get('/metrics', 
  authenticateToken, 
  authorizeRoles('admin', 'moderator'), 
  dashboardController.getMetrics
);

router.put('/users/:id', 
  authenticateToken, 
  authorizeRoles('admin'), 
  dashboardController.modifyUserAccountState
);

module.exports = router;