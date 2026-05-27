const taskRepository = require('../repositories/taskRepository');
const userRepository = require('../repositories/userRepository');
const { executeQuery, oracledb } = require('../config/db');

const moderatorController = {
  // Get pending tasks
  async getPendingTasks(req, res, next) {
    try {
      const { page, limit } = req.query;
      const tasks = await taskRepository.getPending({
        page: parseInt(page) || 1,
        limit: parseInt(limit) || 20
      });
      res.json(tasks);
    } catch (error) {
      next(error);
    }
  },

  // Approve task
  async approveTask(req, res, next) {
    try {
      const success = await taskRepository.updateStatus(req.params.id, 'approved', req.user.id);
      if (!success) {
        return res.status(404).json({ error: 'Task not found' });
      }
      res.json({ message: 'Task approved successfully' });
    } catch (error) {
      next(error);
    }
  },

  // Reject task
  async rejectTask(req, res, next) {
    try {
      const { reason } = req.body;
      const success = await taskRepository.updateStatus(req.params.id, 'rejected', req.user.id);
      if (!success) {
        return res.status(404).json({ error: 'Task not found' });
      }
      res.json({ message: 'Task rejected', reason });
    } catch (error) {
      next(error);
    }
  },

  // Get role requests
  async getRoleRequests(req, res, next) {
    try {
      const sql = `
        SELECT rr.REQUEST_ID, rr.REQUESTED_ROLE, rr.STATUS, rr.CREATED_AT,
               u.USER_ID, u.EMAIL, u.FIRST_NAME, u.LAST_NAME, u.RANK_POINTS
        FROM ROLE_REQUESTS rr
        JOIN USERS u ON rr.USER_ID = u.USER_ID
        WHERE rr.STATUS = 'pending'
        ORDER BY rr.CREATED_AT ASC
      `;
      const result = await executeQuery(sql);
      res.json(result.rows);
    } catch (error) {
      next(error);
    }
  },

  // Approve role request
  async approveRoleRequest(req, res, next) {
    try {
      // Get request
      const requestSql = `SELECT USER_ID, REQUESTED_ROLE FROM ROLE_REQUESTS WHERE REQUEST_ID = :id`;
      const requestResult = await executeQuery(requestSql, [req.params.id]);

      if (requestResult.rows.length === 0) {
        return res.status(404).json({ error: 'Request not found' });
      }

      const { USER_ID, REQUESTED_ROLE } = requestResult.rows[0];

      // Get new role ID
      const role = await userRepository.getRoleByName(REQUESTED_ROLE);
      if (!role) {
        return res.status(400).json({ error: 'Invalid role' });
      }

      // Update user role
      await userRepository.update(USER_ID, { roleId: role.ROLE_ID });

      // Update request status
      await executeQuery(
        `UPDATE ROLE_REQUESTS SET STATUS = 'approved', PROCESSED_BY = :moderatorId, PROCESSED_AT = SYSDATE WHERE REQUEST_ID = :id`,
        { moderatorId: req.user.id, id: req.params.id }
      );

      res.json({ message: 'Role request approved' });
    } catch (error) {
      next(error);
    }
  },

  // Reject role request
  async rejectRoleRequest(req, res, next) {
    try {
      const { reason } = req.body;
      await executeQuery(
        `UPDATE ROLE_REQUESTS SET STATUS = 'rejected', PROCESSED_BY = :moderatorId, PROCESSED_AT = SYSDATE, REJECTION_REASON = :reason WHERE REQUEST_ID = :id`,
        { moderatorId: req.user.id, id: req.params.id, reason: reason || 'Not approved' }
      );
      res.json({ message: 'Role request rejected' });
    } catch (error) {
      next(error);
    }
  },

  // Get banned users
  async getBannedUsers(req, res, next) {
    try {
      const sql = `
        SELECT USER_ID, EMAIL, FIRST_NAME, LAST_NAME, CREATED_AT
        FROM USERS
        WHERE IS_ACTIVE = 0
        ORDER BY CREATED_AT DESC
      `;
      const result = await executeQuery(sql);
      res.json(result.rows);
    } catch (error) {
      next(error);
    }
  },

  // Ban user
  async banUser(req, res, next) {
    try {
      const { reason } = req.body;
      const success = await userRepository.update(req.params.id, { isActive: false });
      if (!success) {
        return res.status(404).json({ error: 'User not found' });
      }
      res.json({ message: 'User banned', reason });
    } catch (error) {
      next(error);
    }
  },

  // Unban user
  async unbanUser(req, res, next) {
    try {
      const success = await userRepository.update(req.params.id, { isActive: true });
      if (!success) {
        return res.status(404).json({ error: 'User not found' });
      }
      res.json({ message: 'User unbanned' });
    } catch (error) {
      next(error);
    }
  },

  // Get prompt logs
  async getPromptLogs(req, res, next) {
    try {
      const { page, limit } = req.query;
      const offset = ((parseInt(page) || 1) - 1) * (parseInt(limit) || 50);

      const sql = `
        SELECT ls.SESSION_ID, ls.PROMPT_CONTENT, ls.TOKENS_USED, ls.SESSION_DATE,
               u.USER_ID, u.EMAIL
        FROM LLM_SESSIONS ls
        JOIN USERS u ON ls.USER_ID = u.USER_ID
        ORDER BY ls.SESSION_DATE DESC
        OFFSET :offset ROWS FETCH NEXT :limit ROWS ONLY
      `;
      const result = await executeQuery(sql, {
        offset,
        limit: parseInt(limit) || 50
      });
      res.json(result.rows);
    } catch (error) {
      next(error);
    }
  }
};

module.exports = moderatorController;
