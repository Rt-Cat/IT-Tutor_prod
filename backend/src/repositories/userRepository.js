const { executeQuery, oracledb } = require('../db');
const bcrypt = require('bcryptjs');

const userRepository = {
  // Find user by ID
  async findById(id) {
    const sql = `
      SELECT u.USER_ID, u.EMAIL, u.FIRST_NAME, u.LAST_NAME, u.PASSWORD_HASH,
             u.IS_ACTIVE, u.CREATED_AT, r.ROLE_NAME
      FROM USERS u
      JOIN ROLES r ON u.ROLE_ID = r.ROLE_ID
      WHERE u.USER_ID = :id
    `;
    const result = await executeQuery(sql, [id]);
    return result.rows[0] || null;
  },

  // Find user by email
  async findByEmail(email) {
    const sql = `
      SELECT u.USER_ID, u.EMAIL, u.FIRST_NAME, u.LAST_NAME, u.PASSWORD_HASH,
             u.IS_ACTIVE, u.CREATED_AT, r.ROLE_NAME, r.ROLE_ID
      FROM USERS u
      JOIN ROLES r ON u.ROLE_ID = r.ROLE_ID
      WHERE LOWER(u.EMAIL) = LOWER(:email)
    `;
    const result = await executeQuery(sql, [email]);
    return result.rows[0] || null;
  },

  // Create new user
  async create({ email, password, firstName, lastName, roleId }) {
    const passwordHash = await bcrypt.hash(password, 12);
    const sql = `
      INSERT INTO USERS (EMAIL, PASSWORD_HASH, FIRST_NAME, LAST_NAME, ROLE_ID, IS_ACTIVE)
      VALUES (:email, :passwordHash, :firstName, :lastName, :roleId, 1)
      RETURNING USER_ID INTO :userId
    `;
    const result = await executeQuery(sql, {
      email,
      passwordHash,
      firstName,
      lastName,
      roleId: roleId || 1,
      userId: { type: oracledb.NUMBER, dir: oracledb.BIND_OUT }
    });
    return result.outBinds.userId[0];
  },

  // Update user
  async update(id, updates) {
    const fields = [];
    const binds = { id };
    
    if (updates.firstName) {
      fields.push('FIRST_NAME = :firstName');
      binds.firstName = updates.firstName;
    }
    if (updates.lastName) {
      fields.push('LAST_NAME = :lastName');
      binds.lastName = updates.lastName;
    }
    if (updates.email) {
      fields.push('EMAIL = :email');
      binds.email = updates.email;
    }
    if (updates.roleId) {
      fields.push('ROLE_ID = :roleId');
      binds.roleId = updates.roleId;
    }
    if (updates.isActive !== undefined) {
      fields.push('IS_ACTIVE = :isActive');
      binds.isActive = updates.isActive ? 1 : 0;
    }

    if (fields.length === 0) return false;

    const sql = `UPDATE USERS SET ${fields.join(', ')} WHERE USER_ID = :id`;
    const result = await executeQuery(sql, binds);
    return result.rowsAffected > 0;
  },

  // Verify password
  async verifyPassword(plainPassword, hashedPassword) {
    return await bcrypt.compare(plainPassword, hashedPassword);
  },

  // Change password
  async changePassword(userId, newPassword) {
    const passwordHash = await bcrypt.hash(newPassword, 12);
    const sql = `UPDATE USERS SET PASSWORD_HASH = :passwordHash WHERE USER_ID = :userId`;
    const result = await executeQuery(sql, { passwordHash, userId });
    return result.rowsAffected > 0;
  },

  // Get all users (for admin)
  async findAll({ page = 1, limit = 20, role = null, search = null }) {
    let sql = `
      SELECT u.USER_ID, u.EMAIL, u.FIRST_NAME, u.LAST_NAME,
             u.IS_ACTIVE, u.CREATED_AT, r.ROLE_NAME
      FROM USERS u
      JOIN ROLES r ON u.ROLE_ID = r.ROLE_ID
      WHERE 1=1
    `;
    const binds = {};

    if (role) {
      sql += ` AND LOWER(r.ROLE_NAME) = LOWER(:role)`;
      binds.role = role;
    }

    if (search) {
      sql += ` AND (LOWER(u.EMAIL) LIKE LOWER(:search) OR LOWER(u.FIRST_NAME) LIKE LOWER(:search) OR LOWER(u.LAST_NAME) LIKE LOWER(:search))`;
      binds.search = `%${search}%`;
    }

    sql += ` ORDER BY u.CREATED_AT DESC`;
    sql += ` OFFSET :offset ROWS FETCH NEXT :limit ROWS ONLY`;
    binds.offset = (page - 1) * limit;
    binds.limit = limit;

    const result = await executeQuery(sql, binds);
    return result.rows;
  },

  // Count users
  async count({ role = null }) {
    let sql = `SELECT COUNT(*) as COUNT FROM USERS u JOIN ROLES r ON u.ROLE_ID = r.ROLE_ID WHERE 1=1`;
    const binds = {};

    if (role) {
      sql += ` AND LOWER(r.ROLE_NAME) = LOWER(:role)`;
      binds.role = role;
    }

    const result = await executeQuery(sql, binds);
    return result.rows[0]?.COUNT || 0;
  },

  // Check if admin exists
  async adminExists() {
    const sql = `
      SELECT COUNT(*) as COUNT FROM USERS u
      JOIN ROLES r ON u.ROLE_ID = r.ROLE_ID
      WHERE LOWER(r.ROLE_NAME) = 'admin'
    `;
    const result = await executeQuery(sql);
    return result.rows[0]?.COUNT > 0;
  },

  // Get role by name
  async getRoleByName(roleName) {
    const sql = `SELECT ROLE_ID, ROLE_NAME FROM ROLES WHERE LOWER(ROLE_NAME) = LOWER(:roleName)`;
    const result = await executeQuery(sql, [roleName]);
    return result.rows[0] || null;
  },

  // Delete user
  async delete(id) {
    const sql = `DELETE FROM USERS WHERE USER_ID = :id`;
    const result = await executeQuery(sql, [id]);
    return result.rowsAffected > 0;
  }
};

module.exports = userRepository;