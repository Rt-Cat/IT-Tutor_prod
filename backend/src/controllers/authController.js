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
        return res.status(400).json({ error: 'Email та пароль є обов\'язковими.' });
      }

      // 1. Перевіряємо, чи існує вже такий email в Oracle
      const checkSql = `SELECT UserID FROM Users WHERE Email = :email`;
      const existingUser = await db.execute(checkSql, { email });
      
      if (existingUser.rows.length > 0) {
        return res.status(409).json({ error: 'Користувач з таким Email вже зареєстрований.' });
      }

      // 2. Хешуємо пароль перед збереженням у БД
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(password, salt);

      // 3. Зберігаємо користувача в базу (роль за замовчуванням 'student', якщо не передано)
      const insertSql = `
        INSERT INTO Users (Email, PasswordHash, Role, IsActive) 
        VALUES (:email, :passwordHash, :role, 1)
      `;
      await db.execute(insertSql, { 
        email, 
        passwordHash, 
        role: role || 'student' 
      });

      res.status(201).json({ message: 'Обліковий запис успішно створено!' });
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