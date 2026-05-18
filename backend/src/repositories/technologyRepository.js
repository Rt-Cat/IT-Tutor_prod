const db = require('../config/db');

class TechnologyRepository {
  async findAll() {
    const sql = `SELECT TechnologyID, Name, Category, Description FROM Technologies ORDER BY Name`;
    const result = await db.execute(sql);
    return result.rows;
  }

  async findById(id) {
    const sql = `SELECT TechnologyID, Name, Category, Description FROM Technologies WHERE TechnologyID = :id`;
    const result = await db.execute(sql, { id });
    return result.rows[0];
  }

  async create({ name, category, description }) {
    const sql = `
      INSERT INTO Technologies (Name, Category, Description) 
      VALUES (:name, :category, :description)
    `;
    return await db.execute(sql, { name, category, description });
  }

  async update(id, { name, category, description }) {
    const sql = `
      UPDATE Technologies 
      SET Name = :name, Category = :category, Description = :description 
      WHERE TechnologyID = :id
    `;
    return await db.execute(sql, { id, name, category, description });
  }

  async linkToProfile({ profileId, technologyId, priorityLevel }) {
    const sql = `
      INSERT INTO ProfileTechnologies (ProfileID, TechnologyID, PriorityLevel)
      VALUES (:profileId, :technologyId, :priorityLevel)
    `;
    return await db.execute(sql, { profileId, technologyId, priorityLevel });
  }
}

module.exports = new TechnologyRepository();