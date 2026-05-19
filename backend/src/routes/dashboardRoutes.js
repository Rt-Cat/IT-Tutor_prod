const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const db = require('../config/db');
const dashboardController = require('../controllers/dashboardController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

router.get('/metrics', 
  authenticateToken, 
  authorizeRoles('admin', 'moderator'), 
  dashboardController.getMetrics
);

router.post('/users', 
  authenticateToken, 
  authorizeRoles('admin'), 
  async (req, res, next) => {
    try {
      const { email, password, role } = req.body;
      
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(password, salt);

      const sql = `INSERT INTO Users (Email, PasswordHash, Role, IsActive) VALUES (:email, :passwordHash, :role, 1)`;
      await db.execute(sql, { email, passwordHash, role });

      res.json({ message: `Користувач з роллю ${role} успішно зареєстрований адміністратором.` });
    } catch (err) { next(err); }
});

router.put('/users/:id', 
  authenticateToken, 
  authorizeRoles('admin'), 
  dashboardController.modifyUserAccountState
);

module.exports = router;