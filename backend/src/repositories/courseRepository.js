const { executeQuery, oracledb } = require('../db');

const courseRepository = {
  // Get all courses
  async findAll({ page = 1, limit = 20, technologyId = null, isActive = true }) {
    let sql = `
      SELECT c.COURSE_ID, c.COURSE_NAME, c.DESCRIPTION, c.IS_ACTIVE, c.CREATED_AT,
             t.TECH_ID, t.TECH_NAME,
             u.USER_ID as INSTRUCTOR_ID, u.FIRST_NAME || ' ' || u.LAST_NAME as INSTRUCTOR_NAME,
             (SELECT COUNT(*) FROM TASKS tk WHERE tk.COURSE_ID = c.COURSE_ID AND tk.STATUS = 'approved') as TASK_COUNT
      FROM COURSES c
      JOIN TECHNOLOGIES t ON c.TECH_ID = t.TECH_ID
      LEFT JOIN USERS u ON c.INSTRUCTOR_ID = u.USER_ID
      WHERE 1=1
    `;
    const binds = {};

    if (isActive !== null) {
      sql += ` AND c.IS_ACTIVE = :isActive`;
      binds.isActive = isActive ? 1 : 0;
    }
    if (technologyId) {
      sql += ` AND c.TECH_ID = :technologyId`;
      binds.technologyId = technologyId;
    }

    sql += ` ORDER BY c.COURSE_NAME`;
    sql += ` OFFSET :offset ROWS FETCH NEXT :limit ROWS ONLY`;
    binds.offset = (page - 1) * limit;
    binds.limit = limit;

    const result = await executeQuery(sql, binds);
    return result.rows;
  },

  // Get course by ID
  async findById(id) {
    const sql = `
      SELECT c.COURSE_ID, c.COURSE_NAME, c.DESCRIPTION, c.IS_ACTIVE, c.CREATED_AT,
             t.TECH_ID, t.TECH_NAME,
             u.USER_ID as INSTRUCTOR_ID, u.FIRST_NAME || ' ' || u.LAST_NAME as INSTRUCTOR_NAME
      FROM COURSES c
      JOIN TECHNOLOGIES t ON c.TECH_ID = t.TECH_ID
      LEFT JOIN USERS u ON c.INSTRUCTOR_ID = u.USER_ID
      WHERE c.COURSE_ID = :id
    `;
    const result = await executeQuery(sql, [id]);
    return result.rows[0] || null;
  },

  // Get courses by instructor
  async findByInstructor(instructorId) {
    const sql = `
      SELECT c.COURSE_ID, c.COURSE_NAME, c.DESCRIPTION, c.IS_ACTIVE, c.CREATED_AT,
             t.TECH_NAME,
             (SELECT COUNT(*) FROM TASKS tk WHERE tk.COURSE_ID = c.COURSE_ID) as TASK_COUNT
      FROM COURSES c
      JOIN TECHNOLOGIES t ON c.TECH_ID = t.TECH_ID
      WHERE c.INSTRUCTOR_ID = :instructorId
      ORDER BY c.CREATED_AT DESC
    `;
    const result = await executeQuery(sql, [instructorId]);
    return result.rows;
  },

  // Create course
  async create({ courseName, description, techId, instructorId }) {
    const sql = `
      INSERT INTO COURSES (COURSE_NAME, DESCRIPTION, TECH_ID, INSTRUCTOR_ID, IS_ACTIVE)
      VALUES (:courseName, :description, :techId, :instructorId, 1)
      RETURNING COURSE_ID INTO :courseId
    `;
    const result = await executeQuery(sql, {
      courseName,
      description,
      techId,
      instructorId,
      courseId: { type: oracledb.NUMBER, dir: oracledb.BIND_OUT }
    });
    return result.outBinds.courseId[0];
  },

  // Update course
  async update(id, updates) {
    const fields = [];
    const binds = { id };

    if (updates.courseName) {
      fields.push('COURSE_NAME = :courseName');
      binds.courseName = updates.courseName;
    }
    if (updates.description) {
      fields.push('DESCRIPTION = :description');
      binds.description = updates.description;
    }
    if (updates.techId) {
      fields.push('TECH_ID = :techId');
      binds.techId = updates.techId;
    }
    if (updates.isActive !== undefined) {
      fields.push('IS_ACTIVE = :isActive');
      binds.isActive = updates.isActive ? 1 : 0;
    }

    if (fields.length === 0) return false;

    const sql = `UPDATE COURSES SET ${fields.join(', ')} WHERE COURSE_ID = :id`;
    const result = await executeQuery(sql, binds);
    return result.rowsAffected > 0;
  },

  // Delete course
  async delete(id) {
    const sql = `DELETE FROM COURSES WHERE COURSE_ID = :id`;
    const result = await executeQuery(sql, [id]);
    return result.rowsAffected > 0;
  },

  // Count courses
  async count({ technologyId = null, isActive = true }) {
    let sql = `SELECT COUNT(*) as COUNT FROM COURSES WHERE 1=1`;
    const binds = {};

    if (isActive !== null) {
      sql += ` AND IS_ACTIVE = :isActive`;
      binds.isActive = isActive ? 1 : 0;
    }
    if (technologyId) {
      sql += ` AND TECH_ID = :technologyId`;
      binds.technologyId = technologyId;
    }

    const result = await executeQuery(sql, binds);
    return result.rows[0]?.COUNT || 0;
  },

  // Get courses with tasks for student
  async getCoursesWithTasks(userId) {
    const sql = `
      SELECT c.COURSE_ID, c.COURSE_NAME, t.TECH_NAME,
             (SELECT COUNT(*) FROM TASKS tk WHERE tk.COURSE_ID = c.COURSE_ID AND tk.STATUS = 'approved') as TOTAL_TASKS,
             (SELECT COUNT(*) FROM TASK_SUBMISSIONS ts 
              JOIN TASKS tk ON ts.TASK_ID = tk.TASK_ID 
              WHERE tk.COURSE_ID = c.COURSE_ID AND ts.USER_ID = :userId AND ts.STATUS = 'completed') as COMPLETED_TASKS
      FROM COURSES c
      JOIN TECHNOLOGIES t ON c.TECH_ID = t.TECH_ID
      WHERE c.IS_ACTIVE = 1
      ORDER BY c.COURSE_NAME
    `;
    const result = await executeQuery(sql, [userId]);
    return result.rows;
  }
};

module.exports = courseRepository;