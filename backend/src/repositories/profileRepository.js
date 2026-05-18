const db = require('../config/db');

class ProfileRepository {
  async findAll() {
    const sql = `SELECT ProfileID, ProfileName, Description, PreferredDifficulty, AIThinkingMode, IsDefault FROM Profiles ORDER BY CreatedAt DESC`;
    const result = await db.execute(sql);
    return result.rows;
  }

  async findById(id) {
    const sql = `SELECT ProfileID, ProfileName, Description, PreferredDifficulty, AIThinkingMode, IsDefault FROM Profiles WHERE ProfileID = :id`;
    const result = await db.execute(sql, { id });
    return result.rows[0];
  }

  async create({ profileName, description, preferredDifficulty, aiThinkingMode, isDefault }) {
    const sql = `
      INSERT INTO Profiles (ProfileName, Description, PreferredDifficulty, AIThinkingMode, IsDefault)
      VALUES (:profileName, :description, :preferredDifficulty, :aiThinkingMode, :isDefault)
    `;
    return await db.execute(sql, { profileName, description, preferredDifficulty, aiThinkingMode, isDefault });
  }

  async resetDefaults() {
    const sql = `UPDATE Profiles SET IsDefault = 0 WHERE IsDefault = 1`;
    return await db.execute(sql);
  }
}

module.exports = new ProfileRepository();