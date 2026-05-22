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

  async update(id, { name, category, description, isPublished }) {
    let sql = `
      UPDATE Technologies 
      SET Name = :name, Category = :category, Description = :description 
    `;
    const params = { id, name, category, description };
    
    // Якщо передано статус публікації, оновлюємо і його
    if (isPublished !== undefined) {
      sql += `, IsPublished = :isPublished`;
      params.isPublished = isPublished;
    }
    
    sql += ` WHERE TechnologyID = :id`;
    return await db.execute(sql, params);
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