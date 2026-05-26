const metricsRepository = require('../repositories/metricsRepository');
const subscriptionRepository = require('../repositories/subscriptionRepository');
const courseRepository = require('../repositories/courseRepository');
const taskRepository = require('../repositories/taskRepository');
const progressRepository = require('../repositories/progressRepository');

const dashboardController = {
  // Student dashboard data
  async getStudentDashboard(req, res, next) {
    try {
      const userId = req.user.id;

      const [metrics, courses, submissions] = await Promise.all([
        metricsRepository.getStudentMetrics(userId),
        courseRepository.getCoursesWithTasks(userId),
        progressRepository.getUserSubmissions(userId, { limit: 5 })
      ]);

      res.json({
        metrics: {
          rankPoints: metrics.RANK_POINTS,
          completedTasks: metrics.COMPLETED_TASKS,
          enrolledCourses: metrics.ENROLLED_COURSES,
          tokensUsed: metrics.TOKENS_USED
        },
        courses,
        recentSubmissions: submissions
      });
    } catch (error) {
      next(error);
    }
  },

  // Instructor dashboard data
  async getInstructorDashboard(req, res, next) {
    try {
      const userId = req.user.id;

      const [metrics, tasks, courses] = await Promise.all([
        metricsRepository.getInstructorMetrics(userId),
        taskRepository.findByInstructor(userId, { limit: 10 }),
        courseRepository.findByInstructor(userId)
      ]);

      res.json({
        metrics: {
          totalTasks: metrics.TOTAL_TASKS,
          approvedTasks: metrics.APPROVED_TASKS,
          pendingTasks: metrics.PENDING_TASKS,
          totalCourses: metrics.TOTAL_COURSES
        },
        recentTasks: tasks,
        courses
      });
    } catch (error) {
      next(error);
    }
  },

  // Moderator dashboard data
  async getModeratorDashboard(req, res, next) {
    try {
      const [metrics, pendingTasks] = await Promise.all([
        metricsRepository.getModeratorMetrics(),
        taskRepository.getPending({ limit: 20 })
      ]);

      res.json({
        metrics: {
          pendingTasks: metrics.PENDING_TASKS,
          pendingRoleRequests: metrics.PENDING_ROLE_REQUESTS,
          bannedUsers: metrics.BANNED_USERS
        },
        pendingTasks
      });
    } catch (error) {
      next(error);
    }
  },

  // Admin dashboard data
  async getAdminDashboard(req, res, next) {
    try {
      const [metrics, subscriptionStats] = await Promise.all([
        metricsRepository.getAdminMetrics(),
        subscriptionRepository.getStats()
      ]);

      res.json({
        metrics: {
          activeUsers: metrics.ACTIVE_USERS,
          publishedTasks: metrics.PUBLISHED_TASKS,
          totalCourses: metrics.TOTAL_COURSES,
          activeSubscriptions: metrics.ACTIVE_SUBSCRIPTIONS,
          totalTokensUsed: metrics.TOTAL_TOKENS_USED,
          pendingModerators: metrics.PENDING_MODERATORS,
          totalUsers: metrics.TOTAL_USERS,
          totalTasks: metrics.TOTAL_TASKS
        },
        subscriptionStats
      });
    } catch (error) {
      next(error);
    }
  },

  // General metrics
  async getMetrics(req, res, next) {
    try {
      const metrics = await metricsRepository.getDashboardMetrics();
      res.json(metrics);
    } catch (error) {
      next(error);
    }
  }
};

module.exports = dashboardController;