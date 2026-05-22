const db = require('../config/db');

class CourseRepository {
  async findAll() {
    const sql = `
      SELECT c.CourseID, c.Title, c.Description, c.LevelType, c.IsPublished, t.Name as TechnologyName 
      FROM Courses c
      JOIN Technologies t ON c.TechnologyID = t.TechnologyID
      ORDER BY c.CreatedAt DESC
    `;
    const result = await db.execute(sql);
    return result.rows;
  }

  async findById(id) {
    const sql = `SELECT CourseID, TechnologyID, Title, Description, LevelType, IsPublished FROM Courses WHERE CourseID = :id`;
    const result = await db.execute(sql, { id });
    return result.rows[0];
  }

  async create({ technologyId, title, description, levelType, isPublished, createdBy }) {
    const sql = `
      INSERT INTO Courses (TechnologyID, Title, Description, LevelType, IsPublished, CreatedBy)
      VALUES (:technologyId, :title, :description, :levelType, :isPublished, :createdBy)
    `;
    return await db.execute(sql, { technologyId, title, description, levelType, isPublished, createdBy });
  }

  async update(id, { technologyId, title, description, levelType, isPublished }) {
    const sql = `
      UPDATE Courses 
      SET TechnologyID = :technologyId, Title = :title, Description = :description, 
          LevelType = :levelType, IsPublished = :isPublished
      WHERE CourseID = :id
    `;
    return await db.execute(sql, { id, technologyId, title, description, levelType, isPublished });
  }
  
  async approve(id) {
    const sql = `UPDATE Courses SET IsPublished = 1 WHERE CourseID = :id`;
    return await db.execute(sql, { id });
  }
}

module.exports = new CourseRepository();