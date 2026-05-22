const db = require('../config/db');

class UserRepository {
  async findByEmail(email) {
    const sql = `SELECT UserID, Email, PasswordHash, Role, IsActive FROM Users WHERE Email = :email`;
    const result = await db.execute(sql, { email });
    return result.rows[0];
  }

  async create({ email, passwordHash, role }) {
    const sql = `
      INSERT INTO Users (Email, PasswordHash, Role) 
      VALUES (:email, :passwordHash, :role)
    `;
    return await db.execute(sql, { email, passwordHash, role: role || 'student' });
  }

  // Для сторінки users.ejs (з підтримкою пошуку та фільтрації)
  async getAllUsers(search = '', role = '', isActive = '') {
    let sql = `
      SELECT UserID, Email, Role, IsActive, TO_CHAR(CreatedAt, 'DD.MM.YYYY HH24:MI') as RegDate
      FROM Users 
      WHERE 1=1
    `;
    const params = {};

    if (search) {
      sql += ` AND LOWER(Email) LIKE '%' || LOWER(:search) || '%'`;
      params.search = search;
    }
    if (role) {
      sql += ` AND Role = :role`;
      params.role = role;
    }
    if (isActive !== '') {
      sql += ` AND IsActive = :isActive`;
      params.isActive = parseInt(isActive);
    }

    sql += ` ORDER BY CreatedAt DESC`;

    const result = await db.execute(sql, params);
    return result.rows;
  }

  // Для зміни статусу акаунту (кнопки в users.ejs)
  async toggleUserStatus(userId, newStatus) {
    const sql = `
      UPDATE Users 
      SET IsActive = :newStatus, UpdatedAt = CURRENT_TIMESTAMP 
      WHERE UserID = :userId
    `;
    await db.execute(sql, { newStatus, userId });
  }

  async updateUserManagementState(id,  role, isActive ) {
    const sql = `
      UPDATE Users 
      SET Role = :role, IsActive = :isActive, UpdatedAt = CURRENT_TIMESTAMP 
      WHERE UserID = :id
    `;
    return await db.execute(sql, { id, role, isActive });
  }
}

module.exports = new UserRepository();