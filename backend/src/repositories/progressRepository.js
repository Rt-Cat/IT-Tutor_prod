const { executeQuery, oracledb } = require('../config/db');

const progressRepository = {
  // Get user's course progress
  async getUserProgress(userId) {
    const sql = `
      SELECT ucp.PROGRESS_ID, ucp.PROGRESS_PERCENTAGE, ucp.LAST_ACCESSED,
             c.COURSE_ID, c.COURSE_NAME,
             t.TECH_NAME
      FROM USER_COURSE_PROGRESS ucp
      JOIN COURSES c ON ucp.COURSE_ID = c.COURSE_ID
      JOIN TECHNOLOGIES t ON c.TECH_ID = t.TECH_ID
      WHERE ucp.USER_ID = :userId
      ORDER BY ucp.LAST_ACCESSED DESC
    `;
    const result = await executeQuery(sql, [userId]);
    return result.rows;
  },

  // Get progress for specific course
  async getCourseProgress(userId, courseId) {
    const sql = `
      SELECT PROGRESS_ID, PROGRESS_PERCENTAGE, LAST_ACCESSED
      FROM USER_COURSE_PROGRESS
      WHERE USER_ID = :userId AND COURSE_ID = :courseId
    `;
    const result = await executeQuery(sql, { userId, courseId });
    return result.rows[0] || null;
  },

  // Create or update progress
  async upsertProgress(userId, courseId, progressPercentage) {
    // Check if exists
    const existing = await this.getCourseProgress(userId, courseId);

    if (existing) {
      const sql = `
        UPDATE USER_COURSE_PROGRESS 
        SET PROGRESS_PERCENTAGE = :progressPercentage, LAST_ACCESSED = SYSDATE
        WHERE USER_ID = :userId AND COURSE_ID = :courseId
      `;
      await executeQuery(sql, { userId, courseId, progressPercentage });
      return existing.PROGRESS_ID;
    } else {
      const sql = `
        INSERT INTO USER_COURSE_PROGRESS (USER_ID, COURSE_ID, PROGRESS_PERCENTAGE, LAST_ACCESSED)
        VALUES (:userId, :courseId, :progressPercentage, SYSDATE)
        RETURNING PROGRESS_ID INTO :progressId
      `;
      const result = await executeQuery(sql, {
        userId,
        courseId,
        progressPercentage,
        progressId: { type: oracledb.NUMBER, dir: oracledb.BIND_OUT }
      });
      return result.outBinds.progressId[0];
    }
  },

  // Submit task solution
  async submitTask(userId, taskId, code) {
    const sql = `
      INSERT INTO TASK_SUBMISSIONS (USER_ID, TASK_ID, SUBMITTED_CODE, STATUS, SUBMITTED_AT)
      VALUES (:userId, :taskId, :code, 'pending', SYSDATE)
      RETURNING SUBMISSION_ID INTO :submissionId
    `;
    const result = await executeQuery(sql, {
      userId,
      taskId,
      code,
      submissionId: { type: oracledb.NUMBER, dir: oracledb.BIND_OUT }
    });
    return result.outBinds.submissionId[0];
  },

  // Get user's task submissions
  async getUserSubmissions(userId, { page = 1, limit = 20 }) {
    const sql = `
      SELECT ts.SUBMISSION_ID, ts.SUBMITTED_CODE, ts.STATUS, ts.SCORE, ts.FEEDBACK, ts.SUBMITTED_AT,
             t.TASK_ID, t.TITLE as TASK_TITLE,
             c.COURSE_NAME
      FROM TASK_SUBMISSIONS ts
      JOIN TASKS t ON ts.TASK_ID = t.TASK_ID
      JOIN COURSES c ON t.COURSE_ID = c.COURSE_ID
      WHERE ts.USER_ID = :userId
      ORDER BY ts.SUBMITTED_AT DESC
      OFFSET :offset ROWS FETCH NEXT :limit ROWS ONLY
    `;
    const result = await executeQuery(sql, {
      userId,
      offset: (page - 1) * limit,
      limit
    });
    return result.rows;
  },

  // Update submission (for grading)
  async updateSubmission(submissionId, { status, score, feedback }) {
    const fields = ['GRADED_AT = SYSDATE'];
    const binds = { submissionId };

    if (status) {
      fields.push('STATUS = :status');
      binds.status = status;
    }
    if (score !== undefined) {
      fields.push('SCORE = :score');
      binds.score = score;
    }
    if (feedback) {
      fields.push('FEEDBACK = :feedback');
      binds.feedback = feedback;
    }

    const sql = `UPDATE TASK_SUBMISSIONS SET ${fields.join(', ')} WHERE SUBMISSION_ID = :submissionId`;
    const result = await executeQuery(sql, binds);
    return result.rowsAffected > 0;
  },

  // Get student rank points
  async getRankPoints(userId) {
    const sql = `SELECT RANK_POINTS FROM USERS WHERE USER_ID = :userId`;
    const result = await executeQuery(sql, [userId]);
    return result.rows[0]?.RANK_POINTS || 0;
  },

  // Update rank points
  async updateRankPoints(userId, pointsToAdd) {
    const sql = `
      UPDATE USERS 
      SET RANK_POINTS = NVL(RANK_POINTS, 0) + :pointsToAdd
      WHERE USER_ID = :userId
    `;
    const result = await executeQuery(sql, { userId, pointsToAdd });
    return result.rowsAffected > 0;
  }
};

module.exports = progressRepository;
