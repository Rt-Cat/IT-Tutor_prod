const { executeQuery, oracledb } = require('../config/db');

const technologyRepository = {
  // Get all technologies
  async findAll() {
    const sql = `
      SELECT TECH_ID, TECH_NAME, DESCRIPTION, IS_ACTIVE, CREATED_AT
      FROM TECHNOLOGIES
      WHERE IS_ACTIVE = 1
      ORDER BY TECH_NAME
    `;
    const result = await executeQuery(sql);
    return result.rows;
  },

  // Get technology by ID
  async findById(id) {
    const sql = `
      SELECT TECH_ID, TECH_NAME, DESCRIPTION, IS_ACTIVE, CREATED_AT
      FROM TECHNOLOGIES
      WHERE TECH_ID = :id
    `;
    const result = await executeQuery(sql, [id]);
    return result.rows[0] || null;
  },

  // Create technology
  async create({ techName, description }) {
    const sql = `
      INSERT INTO TECHNOLOGIES (TECH_NAME, DESCRIPTION, IS_ACTIVE)
      VALUES (:techName, :description, 1)
      RETURNING TECH_ID INTO :techId
    `;
    const result = await executeQuery(sql, {
      techName,
      description,
      techId: { type: oracledb.NUMBER, dir: oracledb.BIND_OUT }
    });
    return result.outBinds.techId[0];
  },

  // Update technology
  async update(id, { techName, description, isActive }) {
    const fields = [];
    const binds = { id };

    if (techName) {
      fields.push('TECH_NAME = :techName');
      binds.techName = techName;
    }
    if (description !== undefined) {
      fields.push('DESCRIPTION = :description');
      binds.description = description;
    }
    if (isActive !== undefined) {
      fields.push('IS_ACTIVE = :isActive');
      binds.isActive = isActive ? 1 : 0;
    }

    if (fields.length === 0) return false;

    const sql = `UPDATE TECHNOLOGIES SET ${fields.join(', ')} WHERE TECH_ID = :id`;
    const result = await executeQuery(sql, binds);
    return result.rowsAffected > 0;
  },

  // Delete technology
  async delete(id) {
    const sql = `DELETE FROM TECHNOLOGIES WHERE TECH_ID = :id`;
    const result = await executeQuery(sql, [id]);
    return result.rowsAffected > 0;
  },

  // Get technologies with course count
  async findAllWithCourseCount() {
    const sql = `
      SELECT t.TECH_ID, t.TECH_NAME, t.DESCRIPTION,
             (SELECT COUNT(*) FROM COURSES c WHERE c.TECH_ID = t.TECH_ID AND c.IS_ACTIVE = 1) as COURSE_COUNT
      FROM TECHNOLOGIES t
      WHERE t.IS_ACTIVE = 1
      ORDER BY t.TECH_NAME
    `;
    const result = await executeQuery(sql);
    return result.rows;
  }
};

module.exports = technologyRepository;
