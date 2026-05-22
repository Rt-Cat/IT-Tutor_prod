const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const db = require('../config/db');
const dashboardController = require('../controllers/dashboardController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

router.get('/subscriptions', authenticateToken, authorizeRoles('admin', 'moderator'), dashboardController.getSubscriptionsList);

// Глобальна статистика (Дашборд)
router.get('/metrics', 
  authenticateToken, 
  authorizeRoles('admin', 'moderator'), 
  dashboardController.getMetrics
);

// Отримання списку користувачів
router.get('/users',
  authenticateToken,
  authorizeRoles('admin'),
  dashboardController.getUsersList
);

// Зміна статусу користувача (PATCH замість PUT, бо ми змінюємо лише одне поле)
router.patch('/users/:id/toggle', 
  authenticateToken, 
  authorizeRoles('admin', 'moderator'), 
  dashboardController.toggleUserStatus
);

router.put('/users/:id/state', 
  authenticateToken, 
  authorizeRoles('admin', 'moderator'), 
  dashboardController.modifyUserAccountState
);
router.post('/subscriptions/plans', authenticateToken, authorizeRoles('admin', 'moderator'), dashboardController.createSubscriptionPlan);
router.put('/subscriptions/plans/:id', authenticateToken, authorizeRoles('admin', 'moderator'), dashboardController.updateSubscriptionPlan);

router.post('/subscriptions/grant', authenticateToken, authorizeRoles('admin', 'moderator'), dashboardController.manualGrantSubscription);
router.delete('/subscriptions/remove/:id', authenticateToken, authorizeRoles('admin', 'moderator'), dashboardController.manualDeleteSubscription);

router.post('/subscriptions/rules', authenticateToken, authorizeRoles('admin', 'moderator'), dashboardController.bindTaskToPlan);

// Створення користувача адміністратором вручну (залишив, оскільки він у вас був)
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

      res.json({ message: `Користувач з роллю ${role} успішно зареєстрований.` });
    } catch (err) { next(err); }
});

module.exports = router;