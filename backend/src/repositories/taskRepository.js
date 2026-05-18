const db = require('../config/db');

class TaskRepository {
  async findByCourseId(courseId) {
    const sql = `SELECT TaskID, CourseID, Title, Difficulty, EstimatedMinutes, IsFree, IsPublished FROM Tasks WHERE CourseID = :courseId ORDER BY SortOrder`;
    const result = await db.execute(sql, { courseId });
    return result.rows;
  }

  async findById(id) {
    const sql = `SELECT TaskID, CourseID, Title, TaskDescription, Difficulty, EstimatedMinutes, IsFree, IsPublished FROM Tasks WHERE TaskID = :id`;
    const result = await db.execute(sql, { id });
    return result.rows[0];
  }

  async create({ courseId, title, taskDescription, difficulty, estimatedMinutes, isFree, isPublished, sortOrder }) {
    const sql = `
      INSERT INTO Tasks (CourseID, Title, TaskDescription, Difficulty, EstimatedMinutes, IsFree, IsPublished, SortOrder)
      VALUES (:courseId, :title, :taskDescription, :difficulty, :estimatedMinutes, :isFree, :isPublished, :sortOrder)
    `;
    return await db.execute(sql, { courseId, title, taskDescription, difficulty, estimatedMinutes, isFree, isPublished, sortOrder });
  }

  async update(id, { title, taskDescription, difficulty, estimatedMinutes, isFree, isPublished, sortOrder }) {
    const sql = `
      UPDATE Tasks 
      SET Title = :title, TaskDescription = :taskDescription, Difficulty = :difficulty, 
          EstimatedMinutes = :estimatedMinutes, IsFree = :isFree, IsPublished = :isPublished, SortOrder = :sortOrder
      WHERE TaskID = :id
    `;
    return await db.execute(sql, { id, title, taskDescription, difficulty, estimatedMinutes, isFree, isPublished, sortOrder });
  }

  async createPrompt({ taskId, promptType, promptContent }) {
    const sql = `
      INSERT INTO TaskPrompts (TaskID, PromptType, PromptContent)
      VALUES (:taskId, :promptType, :promptContent)
    `;
    return await db.execute(sql, { taskId, promptType, promptContent });
  }
}

module.exports = new TaskRepository();