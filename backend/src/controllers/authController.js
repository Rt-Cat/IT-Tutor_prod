const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');

class AuthController {
  
  // ==========================================
  // РЕЄСТРАЦІЯ КОРИСТУВАЧА
  // ==========================================
  async register(req, res, next) {
    try {
      const { email, password, role } = req.body;

      if (!email || !password) {
        return res.status(400).json({ error: 'Email та пароль обов\'язкові.' });
      }

      const requestedRole = role || 'student';
      let isActive = 1; // За замовчуванням акаунт активний
      let successMessage = 'Обліковий запис успішно створено!';

      // 1. ЛОГІКА ДЛЯ АДМІНІСТРАТОРА (Bootstrap Admin)
      if (requestedRole === 'admin') {
        const adminCheckSql = `SELECT COUNT(*) AS AdminCount FROM Users WHERE Role = 'admin'`;
        const adminCheckResult = await db.execute(adminCheckSql, {});
        
        // В Oracle імена колонок у результатах зазвичай у верхньому регістрі (ADMINCOUNT)
        const adminCount = adminCheckResult.rows[0].ADMINCOUNT || adminCheckResult.rows[0].admincount || 0;

        if (adminCount > 0) {
          return res.status(403).json({ 
            error: 'Головний адміністратор вже існує. Створення нових адмінів можливе лише з панелі керування.' 
          });
        }
      }

      // 2. ЛОГІКА ДЛЯ МОДЕРАТОРА (Реєстрація очікує підтвердження)
      if (requestedRole === 'moderator') {
        isActive = 0; // Блокуємо вхід до апруву
        successMessage = 'Заявку на роль Модератора прийнято! Очікуйте підтвердження адміністратором.';
      }

      // 3. Перевірка на унікальність Email
      const checkEmailSql = `SELECT UserID FROM Users WHERE Email = :email`;
      const existingUser = await db.execute(checkEmailSql, { email });
      if (existingUser.rows.length > 0) {
        return res.status(409).json({ error: 'Користувач з таким Email вже зареєстрований.' });
      }

      // 4. Хешування та збереження в БД
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(password, salt);

      const insertSql = `
        INSERT INTO Users (Email, PasswordHash, Role, IsActive) 
        VALUES (:email, :passwordHash, :role, :isActive)
      `;
      await db.execute(insertSql, { 
        email, 
        passwordHash, 
        role: requestedRole,
        isActive 
      });

      res.status(201).json({ message: successMessage });
    } catch (err) {
      next(err);
    }
  }

  async checkAdminExists(req, res, next) {
  try {
    const sql = `SELECT COUNT(*) AS AdminCount FROM Users WHERE Role = 'admin'`;
    const result = await db.execute(sql, {});
    const count = result.rows[0].ADMINCOUNT || result.rows[0].admincount || 0;
    
    res.json({ exists: count > 0 });
  } catch (err) {
    next(err);
  }
}

  // ==========================================
  // АВТОРИЗАЦІЯ (ЛОГІН)
  // ==========================================
  async login(req, res, next) {
    try {
      const { email, password } = req.body;

      // 1. Шукаємо користувача
      const sql = `SELECT UserID, Email, PasswordHash, Role, IsActive FROM Users WHERE Email = :email`;
      const result = await db.execute(sql, { email });
      const user = result.rows[0];

      // 2. Перевірки безпеки
      if (!user) return res.status(401).json({ error: 'Невірний email або пароль.' });
      if (user.ISACTIVE === 0) return res.status(403).json({ error: 'Ваш обліковий запис заблоковано адміністратором.' });

      // 3. Валідація хешу пароля
      const isMatch = await bcrypt.compare(password, user.PASSWORDHASH);
      if (!isMatch) return res.status(401).json({ error: 'Невірний email або пароль.' });

      // 4. Генерація безпечного JWT токена
      const token = jwt.sign(
        { userId: user.USERID, role: user.ROLE },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );

      res.json({
        message: 'Авторизація успішна.',
        token,
        user: { userId: user.USERID, email: user.EMAIL, role: user.ROLE }
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new AuthController();