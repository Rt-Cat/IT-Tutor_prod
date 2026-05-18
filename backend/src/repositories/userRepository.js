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
  
  async findAllMetrics() {
    const sql = `SELECT UserID, Email, Role, IsActive, CreatedAt FROM Users ORDER BY CreatedAt DESC`;
    const result = await db.execute(sql);
    return result.rows;
  }

  async updateUserManagementState(id, { role, isActive }) {
    const sql = `
      UPDATE Users 
      SET Role = :role, IsActive = :isActive, UpdatedAt = CURRENT_TIMESTAMP 
      WHERE UserID = :id
    `;
    return await db.execute(sql, { id, role, isActive });
  }

}

module.exports = new UserRepository();