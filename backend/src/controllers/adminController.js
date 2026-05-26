const userRepository = require('../repositories/userRepository');
const metricsRepository = require('../repositories/metricsRepository');
const subscriptionRepository = require('../repositories/subscriptionRepository');
const technologyRepository = require('../repositories/technologyRepository');
const { executeQuery } = require('../db');

const adminController = {
  // Get all users
  async getUsers(req, res, next) {
    try {
      const { page, limit, role, search } = req.query;
      const users = await userRepository.findAll({
        page: parseInt(page) || 1,
        limit: parseInt(limit) || 20,
        role,
        search
      });
      const total = await userRepository.count({ role });
      res.json({ users, total });
    } catch (error) {
      next(error);
    }
  },

  // Get user by ID
  async getUserById(req, res, next) {
    try {
      const user = await userRepository.findById(req.params.id);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      res.json({
        id: user.USER_ID,
        email: user.EMAIL,
        firstName: user.FIRST_NAME,
        lastName: user.LAST_NAME,
        role: user.ROLE_NAME,
        isActive: user.IS_ACTIVE,
        createdAt: user.CREATED_AT
      });
    } catch (error) {
      next(error);
    }
  },

  // Update user
  async updateUser(req, res, next) {
    try {
      const { firstName, lastName, email, role, isActive } = req.body;

      let roleId;
      if (role) {
        const roleData = await userRepository.getRoleByName(role);
        if (roleData) {
          roleId = roleData.ROLE_ID;
        }
      }

      const success = await userRepository.update(req.params.id, {
        firstName,
        lastName,
        email,
        roleId,
        isActive
      });

      if (!success) {
        return res.status(404).json({ error: 'User not found' });
      }

      const user = await userRepository.findById(req.params.id);
      res.json({ message: 'User updated', user });
    } catch (error) {
      next(error);
    }
  },

  // Delete user
  async deleteUser(req, res, next) {
    try {
      // Prevent self-deletion
      if (parseInt(req.params.id) === req.user.id) {
        return res.status(400).json({ error: 'Cannot delete your own account' });
      }

      const success = await userRepository.delete(req.params.id);
      if (!success) {
        return res.status(404).json({ error: 'User not found' });
      }
      res.json({ message: 'User deleted' });
    } catch (error) {
      next(error);
    }
  },

  // Get pending moderators
  async getPendingModerators(req, res, next) {
    try {
      const sql = `
        SELECT u.USER_ID, u.EMAIL, u.FIRST_NAME, u.LAST_NAME, u.CREATED_AT
        FROM USERS u
        JOIN ROLES r ON u.ROLE_ID = r.ROLE_ID
        WHERE LOWER(r.ROLE_NAME) = 'moderator' AND u.IS_ACTIVE = 0
        ORDER BY u.CREATED_AT DESC
      `;
      const result = await executeQuery(sql);
      res.json(result.rows);
    } catch (error) {
      next(error);
    }
  },

  // Activate moderator
  async activateModerator(req, res, next) {
    try {
      const success = await userRepository.update(req.params.id, { isActive: true });
      if (!success) {
        return res.status(404).json({ error: 'User not found' });
      }
      res.json({ message: 'Moderator activated' });
    } catch (error) {
      next(error);
    }
  },

  // Deactivate moderator
  async deactivateModerator(req, res, next) {
    try {
      const success = await userRepository.update(req.params.id, { isActive: false });
      if (!success) {
        return res.status(404).json({ error: 'User not found' });
      }
      res.json({ message: 'Moderator deactivated' });
    } catch (error) {
      next(error);
    }
  },

  // Get subscription stats
  async getSubscriptionStats(req, res, next) {
    try {
      const stats = await subscriptionRepository.getStats();
      res.json(stats);
    } catch (error) {
      next(error);
    }
  },

  // Create subscription plan
  async createPlan(req, res, next) {
    try {
      const { planName, price, tokenLimit, durationDays, features } = req.body;

      if (!planName || !price || !tokenLimit) {
        return res.status(400).json({ error: 'Plan name, price, and token limit are required' });
      }

      const planId = await subscriptionRepository.createPlan({
        planName,
        price,
        tokenLimit,
        durationDays: durationDays || 30,
        features
      });

      res.status(201).json({ message: 'Plan created', planId });
    } catch (error) {
      next(error);
    }
  },

  // Update subscription plan
  async updatePlan(req, res, next) {
    try {
      const { planName, price, tokenLimit, isActive } = req.body;

      const success = await subscriptionRepository.updatePlan(req.params.id, {
        planName,
        price,
        tokenLimit,
        isActive
      });

      if (!success) {
        return res.status(404).json({ error: 'Plan not found' });
      }
      res.json({ message: 'Plan updated' });
    } catch (error) {
      next(error);
    }
  },

  // Get system metrics
  async getSystemMetrics(req, res, next) {
    try {
      const metrics = await metricsRepository.getAdminMetrics();
      res.json(metrics);
    } catch (error) {
      next(error);
    }
  },

  // Get token usage
  async getTokenUsage(req, res, next) {
    try {
      const sql = `
        SELECT 
          TRUNC(SESSION_DATE) as DATE_,
          COUNT(DISTINCT USER_ID) as UNIQUE_USERS,
          SUM(TOKENS_USED) as TOTAL_TOKENS
        FROM LLM_SESSIONS
        WHERE SESSION_DATE >= SYSDATE - 30
        GROUP BY TRUNC(SESSION_DATE)
        ORDER BY DATE_ DESC
      `;
      const result = await executeQuery(sql);
      res.json(result.rows);
    } catch (error) {
      next(error);
    }
  },

  // Create technology
  async createTechnology(req, res, next) {
    try {
      const { techName, description } = req.body;

      if (!techName) {
        return res.status(400).json({ error: 'Technology name is required' });
      }

      const techId = await technologyRepository.create({ techName, description });
      res.status(201).json({ message: 'Technology created', techId });
    } catch (error) {
      next(error);
    }
  },

  // Update technology
  async updateTechnology(req, res, next) {
    try {
      const { techName, description, isActive } = req.body;

      const success = await technologyRepository.update(req.params.id, {
        techName,
        description,
        isActive
      });

      if (!success) {
        return res.status(404).json({ error: 'Technology not found' });
      }
      res.json({ message: 'Technology updated' });
    } catch (error) {
      next(error);
    }
  },

  // Delete technology
  async deleteTechnology(req, res, next) {
    try {
      const success = await technologyRepository.delete(req.params.id);
      if (!success) {
        return res.status(404).json({ error: 'Technology not found' });
      }
      res.json({ message: 'Technology deleted' });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = adminController;