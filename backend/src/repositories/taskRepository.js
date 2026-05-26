const { executeQuery, executeWithClob, oracledb } = require('../db');

const taskRepository = {
  // Get all tasks with filters
  async findAll({ page = 1, limit = 20, status = null, courseId = null, difficulty = null }) {
    let sql = `
      SELECT t.TASK_ID, t.TITLE, t.DESCRIPTION, t.DIFFICULTY_LEVEL, t.ESTIMATED_MINUTES,
             t.IS_FREE, t.STATUS, t.CREATED_AT, t.UPDATED_AT,
             c.COURSE_ID, c.COURSE_NAME,
             u.USER_ID as CREATED_BY_ID, u.FIRST_NAME || ' ' || u.LAST_NAME as CREATED_BY_NAME
      FROM TASKS t
      JOIN COURSES c ON t.COURSE_ID = c.COURSE_ID
      LEFT JOIN USERS u ON t.CREATED_BY = u.USER_ID
      WHERE 1=1
    `;
    const binds = {};

    if (status) {
      sql += ` AND LOWER(t.STATUS) = LOWER(:status)`;
      binds.status = status;
    }
    if (courseId) {
      sql += ` AND t.COURSE_ID = :courseId`;
      binds.courseId = courseId;
    }
    if (difficulty) {
      sql += ` AND LOWER(t.DIFFICULTY_LEVEL) = LOWER(:difficulty)`;
      binds.difficulty = difficulty;
    }

    sql += ` ORDER BY t.CREATED_AT DESC`;
    sql += ` OFFSET :offset ROWS FETCH NEXT :limit ROWS ONLY`;
    binds.offset = (page - 1) * limit;
    binds.limit = limit;

    const result = await executeQuery(sql, binds);
    return result.rows;
  },

  // Get task by ID
  async findById(id) {
    const sql = `
      SELECT t.TASK_ID, t.TITLE, t.DESCRIPTION, t.DIFFICULTY_LEVEL, t.ESTIMATED_MINUTES,
             t.IS_FREE, t.STATUS, t.CREATED_AT, t.UPDATED_AT,
             c.COURSE_ID, c.COURSE_NAME,
             u.USER_ID as CREATED_BY_ID, u.FIRST_NAME || ' ' || u.LAST_NAME as CREATED_BY_NAME
      FROM TASKS t
      JOIN COURSES c ON t.COURSE_ID = c.COURSE_ID
      LEFT JOIN USERS u ON t.CREATED_BY = u.USER_ID
      WHERE t.TASK_ID = :id
    `;
    const result = await executeQuery(sql, [id]);
    return result.rows[0] || null;
  },

  // Get tasks by instructor
  async findByInstructor(userId, { page = 1, limit = 20 }) {
    const sql = `
      SELECT t.TASK_ID, t.TITLE, t.DIFFICULTY_LEVEL, t.STATUS, t.CREATED_AT,
             c.COURSE_NAME
      FROM TASKS t
      JOIN COURSES c ON t.COURSE_ID = c.COURSE_ID
      WHERE t.CREATED_BY = :userId
      ORDER BY t.CREATED_AT DESC
      OFFSET :offset ROWS FETCH NEXT :limit ROWS ONLY
    `;
    const result = await executeQuery(sql, {
      userId,
      offset: (page - 1) * limit,
      limit
    });
    return result.rows;
  },

  // Create task
  async create({ title, description, courseId, difficultyLevel, estimatedMinutes, isFree, createdBy }) {
    const sql = `
      INSERT INTO TASKS (TITLE, DESCRIPTION, COURSE_ID, DIFFICULTY_LEVEL, ESTIMATED_MINUTES, IS_FREE, CREATED_BY, STATUS)
      VALUES (:title, :description, :courseId, :difficultyLevel, :estimatedMinutes, :isFree, :createdBy, 'pending')
      RETURNING TASK_ID INTO :taskId
    `;
    const result = await executeWithClob(sql, {
      title,
      description,
      courseId,
      difficultyLevel,
      estimatedMinutes: estimatedMinutes || 15,
      isFree: isFree ? 1 : 0,
      createdBy,
      taskId: { type: oracledb.NUMBER, dir: oracledb.BIND_OUT }
    });
    return result.outBinds.taskId[0];
  },

  // Update task
  async update(id, updates) {
    const fields = [];
    const binds = { id };

    if (updates.title) {
      fields.push('TITLE = :title');
      binds.title = updates.title;
    }
    if (updates.description) {
      fields.push('DESCRIPTION = :description');
      binds.description = updates.description;
    }
    if (updates.difficultyLevel) {
      fields.push('DIFFICULTY_LEVEL = :difficultyLevel');
      binds.difficultyLevel = updates.difficultyLevel;
    }
    if (updates.estimatedMinutes) {
      fields.push('ESTIMATED_MINUTES = :estimatedMinutes');
      binds.estimatedMinutes = updates.estimatedMinutes;
    }
    if (updates.isFree !== undefined) {
      fields.push('IS_FREE = :isFree');
      binds.isFree = updates.isFree ? 1 : 0;
    }
    if (updates.status) {
      fields.push('STATUS = :status');
      binds.status = updates.status;
    }

    fields.push('UPDATED_AT = SYSDATE');

    if (fields.length === 1) return false;

    const sql = `UPDATE TASKS SET ${fields.join(', ')} WHERE TASK_ID = :id`;
    const result = await executeQuery(sql, binds);
    return result.rowsAffected > 0;
  },

  // Update task status (for moderation)
  async updateStatus(id, status, moderatorId = null) {
    const sql = `
      UPDATE TASKS 
      SET STATUS = :status, 
          MODERATED_BY = :moderatorId,
          MODERATED_AT = SYSDATE,
          UPDATED_AT = SYSDATE
      WHERE TASK_ID = :id
    `;
    const result = await executeQuery(sql, { id, status, moderatorId });
    return result.rowsAffected > 0;
  },

  // Delete task
  async delete(id) {
    const sql = `DELETE FROM TASKS WHERE TASK_ID = :id`;
    const result = await executeQuery(sql, [id]);
    return result.rowsAffected > 0;
  },

  // Get pending tasks (for moderation)
  async getPending({ page = 1, limit = 20 }) {
    const sql = `
      SELECT t.TASK_ID, t.TITLE, t.DESCRIPTION, t.DIFFICULTY_LEVEL, t.CREATED_AT,
             c.COURSE_NAME,
             u.FIRST_NAME || ' ' || u.LAST_NAME as INSTRUCTOR_NAME
      FROM TASKS t
      JOIN COURSES c ON t.COURSE_ID = c.COURSE_ID
      LEFT JOIN USERS u ON t.CREATED_BY = u.USER_ID
      WHERE t.STATUS = 'pending'
      ORDER BY t.CREATED_AT ASC
      OFFSET :offset ROWS FETCH NEXT :limit ROWS ONLY
    `;
    const result = await executeQuery(sql, {
      offset: (page - 1) * limit,
      limit
    });
    return result.rows;
  },

  // Count tasks
  async count({ status = null, courseId = null }) {
    let sql = `SELECT COUNT(*) as COUNT FROM TASKS WHERE 1=1`;
    const binds = {};

    if (status) {
      sql += ` AND LOWER(STATUS) = LOWER(:status)`;
      binds.status = status;
    }
    if (courseId) {
      sql += ` AND COURSE_ID = :courseId`;
      binds.courseId = courseId;
    }

    const result = await executeQuery(sql, binds);
    return result.rows[0]?.COUNT || 0;
  }
};

module.exports = taskRepository;