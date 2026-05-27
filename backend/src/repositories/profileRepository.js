const { executeQuery, oracledb } = require('../config/db');

const profileRepository = {
  // Get all profiles for a user
  async findByUserId(userId) {
    const sql = `
      SELECT PROFILE_ID, USER_ID, PROFILE_NAME, THINKING_MODE, 
             IS_DEFAULT, CREATED_AT, UPDATED_AT
      FROM LLM_PROFILES
      WHERE USER_ID = :userId
      ORDER BY IS_DEFAULT DESC, CREATED_AT DESC
    `;
    const result = await executeQuery(sql, [userId]);
    return result.rows;
  },

  // Get profile by ID
  async findById(id) {
    const sql = `
      SELECT PROFILE_ID, USER_ID, PROFILE_NAME, THINKING_MODE, 
             IS_DEFAULT, CREATED_AT, UPDATED_AT
      FROM LLM_PROFILES
      WHERE PROFILE_ID = :id
    `;
    const result = await executeQuery(sql, [id]);
    return result.rows[0] || null;
  },

  // Create new profile
  async create({ userId, profileName, thinkingMode = 'balanced', isDefault = false }) {
    // If setting as default, unset other defaults first
    if (isDefault) {
      await executeQuery(
        `UPDATE LLM_PROFILES SET IS_DEFAULT = 0 WHERE USER_ID = :userId`,
        [userId]
      );
    }

    const sql = `
      INSERT INTO LLM_PROFILES (USER_ID, PROFILE_NAME, THINKING_MODE, IS_DEFAULT)
      VALUES (:userId, :profileName, :thinkingMode, :isDefault)
      RETURNING PROFILE_ID INTO :profileId
    `;
    const result = await executeQuery(sql, {
      userId,
      profileName,
      thinkingMode,
      isDefault: isDefault ? 1 : 0,
      profileId: { type: oracledb.NUMBER, dir: oracledb.BIND_OUT }
    });
    return result.outBinds.profileId[0];
  },

  // Update profile
  async update(id, { profileName, thinkingMode, isDefault }) {
    const fields = [];
    const binds = { id };

    if (profileName) {
      fields.push('PROFILE_NAME = :profileName');
      binds.profileName = profileName;
    }
    if (thinkingMode) {
      fields.push('THINKING_MODE = :thinkingMode');
      binds.thinkingMode = thinkingMode;
    }
    if (isDefault !== undefined) {
      fields.push('IS_DEFAULT = :isDefault');
      binds.isDefault = isDefault ? 1 : 0;
    }

    fields.push('UPDATED_AT = SYSDATE');

    if (fields.length === 1) return false; // Only UPDATED_AT

    const sql = `UPDATE LLM_PROFILES SET ${fields.join(', ')} WHERE PROFILE_ID = :id`;
    const result = await executeQuery(sql, binds);
    return result.rowsAffected > 0;
  },

  // Delete profile
  async delete(id) {
    const sql = `DELETE FROM LLM_PROFILES WHERE PROFILE_ID = :id`;
    const result = await executeQuery(sql, [id]);
    return result.rowsAffected > 0;
  },

  // Set profile as default
  async setDefault(userId, profileId) {
    // Unset all defaults for this user
    await executeQuery(
      `UPDATE LLM_PROFILES SET IS_DEFAULT = 0 WHERE USER_ID = :userId`,
      [userId]
    );
    // Set the specified profile as default
    const sql = `UPDATE LLM_PROFILES SET IS_DEFAULT = 1 WHERE PROFILE_ID = :profileId AND USER_ID = :userId`;
    const result = await executeQuery(sql, { profileId, userId });
    return result.rowsAffected > 0;
  },

  // Get default profile for user
  async getDefault(userId) {
    const sql = `
      SELECT PROFILE_ID, USER_ID, PROFILE_NAME, THINKING_MODE, IS_DEFAULT
      FROM LLM_PROFILES
      WHERE USER_ID = :userId AND IS_DEFAULT = 1
    `;
    const result = await executeQuery(sql, [userId]);
    return result.rows[0] || null;
  }
};

module.exports = profileRepository;
