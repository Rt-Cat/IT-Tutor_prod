const progressRepository = require('../repositories/progressRepository');
const courseRepository = require('../repositories/courseRepository');
const { executeQuery, oracledb } = require('../db');

const studentController = {
  // Get enrolled courses with progress
  async getEnrolledCourses(req, res, next) {
    try {
      const courses = await courseRepository.getCoursesWithTasks(req.user.id);
      res.json(courses);
    } catch (error) {
      next(error);
    }
  },

  // Get all progress
  async getProgress(req, res, next) {
    try {
      const progress = await progressRepository.getUserProgress(req.user.id);
      res.json(progress);
    } catch (error) {
      next(error);
    }
  },

  // Submit task solution
  async submitTask(req, res, next) {
    try {
      const { taskId, code } = req.body;

      if (!taskId || !code) {
        return res.status(400).json({ error: 'Task ID and code are required' });
      }

      const submissionId = await progressRepository.submitTask(req.user.id, taskId, code);

      res.status(201).json({
        message: 'Solution submitted successfully',
        submissionId,
        status: 'pending'
      });
    } catch (error) {
      next(error);
    }
  },

  // Get submission history
  async getSubmissions(req, res, next) {
    try {
      const { page, limit } = req.query;
      const submissions = await progressRepository.getUserSubmissions(req.user.id, {
        page: parseInt(page) || 1,
        limit: parseInt(limit) || 20
      });
      res.json(submissions);
    } catch (error) {
      next(error);
    }
  },

  // Get rank/score
  async getRank(req, res, next) {
    try {
      const rankPoints = await progressRepository.getRankPoints(req.user.id);

      // Calculate rank level
      let level = 'Beginner';
      if (rankPoints >= 1000) level = 'Expert';
      else if (rankPoints >= 500) level = 'Advanced';
      else if (rankPoints >= 100) level = 'Intermediate';

      res.json({
        rankPoints,
        level,
        nextLevelAt: rankPoints < 100 ? 100 : rankPoints < 500 ? 500 : rankPoints < 1000 ? 1000 : null
      });
    } catch (error) {
      next(error);
    }
  },

  // Request instructor role
  async requestInstructorRole(req, res, next) {
    try {
      const rankPoints = await progressRepository.getRankPoints(req.user.id);

      // Check if meets requirements
      if (rankPoints < 500) {
        return res.status(400).json({
          error: 'Insufficient rank points',
          message: `You need at least 500 rank points to request instructor role. Current: ${rankPoints}`
        });
      }

      // Check if already requested
      const existingRequest = await executeQuery(
        `SELECT REQUEST_ID FROM ROLE_REQUESTS WHERE USER_ID = :userId AND STATUS = 'pending'`,
        [req.user.id]
      );

      if (existingRequest.rows.length > 0) {
        return res.status(400).json({ error: 'You already have a pending request' });
      }

      // Create request
      const sql = `
        INSERT INTO ROLE_REQUESTS (USER_ID, REQUESTED_ROLE, STATUS, CREATED_AT)
        VALUES (:userId, 'instructor', 'pending', SYSDATE)
        RETURNING REQUEST_ID INTO :requestId
      `;
      const result = await executeQuery(sql, {
        userId: req.user.id,
        requestId: { type: oracledb.NUMBER, dir: oracledb.BIND_OUT }
      });

      res.status(201).json({
        message: 'Instructor role request submitted',
        requestId: result.outBinds.requestId[0]
      });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = studentController;