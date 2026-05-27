const { executeQuery } = require('../config/db');

const metricsRepository = {
  // Get dashboard metrics
  async getDashboardMetrics() {
    const sql = `
      SELECT 
        (SELECT COUNT(*) FROM USERS WHERE IS_ACTIVE = 1) as ACTIVE_USERS,
        (SELECT COUNT(*) FROM TASKS WHERE STATUS = 'approved') as PUBLISHED_TASKS,
        (SELECT COUNT(*) FROM COURSES WHERE IS_ACTIVE = 1) as TOTAL_COURSES,
        (SELECT COUNT(*) FROM USER_SUBSCRIPTIONS WHERE END_DATE > SYSDATE) as ACTIVE_SUBSCRIPTIONS,
        (SELECT NVL(SUM(TOKENS_USED), 0) FROM LLM_SESSIONS) as TOTAL_TOKENS_USED
      FROM DUAL
    `;
    const result = await executeQuery(sql);
    return result.rows[0] || {
      ACTIVE_USERS: 0,
      PUBLISHED_TASKS: 0,
      TOTAL_COURSES: 0,
      ACTIVE_SUBSCRIPTIONS: 0,
      TOTAL_TOKENS_USED: 0
    };
  },

  // Get student metrics for a specific user
  async getStudentMetrics(userId) {
    const sql = `
      SELECT 
        NVL(u.RANK_POINTS, 0) as RANK_POINTS,
        (SELECT COUNT(*) FROM TASK_SUBMISSIONS ts WHERE ts.USER_ID = :userId) as COMPLETED_TASKS,
        (SELECT COUNT(*) FROM USER_COURSE_PROGRESS ucp WHERE ucp.USER_ID = :userId) as ENROLLED_COURSES,
        (SELECT NVL(SUM(TOKENS_USED), 0) FROM LLM_SESSIONS ls WHERE ls.USER_ID = :userId) as TOKENS_USED
      FROM USERS u
      WHERE u.USER_ID = :userId
    `;
    const result = await executeQuery(sql, { userId });
    return result.rows[0] || {
      RANK_POINTS: 0,
      COMPLETED_TASKS: 0,
      ENROLLED_COURSES: 0,
      TOKENS_USED: 0
    };
  },

  // Get instructor metrics
  async getInstructorMetrics(userId) {
    const sql = `
      SELECT 
        (SELECT COUNT(*) FROM TASKS t WHERE t.CREATED_BY = :userId) as TOTAL_TASKS,
        (SELECT COUNT(*) FROM TASKS t WHERE t.CREATED_BY = :userId AND t.STATUS = 'approved') as APPROVED_TASKS,
        (SELECT COUNT(*) FROM TASKS t WHERE t.CREATED_BY = :userId AND t.STATUS = 'pending') as PENDING_TASKS,
        (SELECT COUNT(*) FROM COURSES c WHERE c.INSTRUCTOR_ID = :userId) as TOTAL_COURSES
      FROM DUAL
    `;
    const result = await executeQuery(sql, { userId });
    return result.rows[0] || {
      TOTAL_TASKS: 0,
      APPROVED_TASKS: 0,
      PENDING_TASKS: 0,
      TOTAL_COURSES: 0
    };
  },

  // Get moderator metrics
  async getModeratorMetrics() {
    const sql = `
      SELECT 
        (SELECT COUNT(*) FROM TASKS WHERE STATUS = 'pending') as PENDING_TASKS,
        (SELECT COUNT(*) FROM ROLE_REQUESTS WHERE STATUS = 'pending') as PENDING_ROLE_REQUESTS,
        (SELECT COUNT(*) FROM USERS WHERE IS_ACTIVE = 0) as BANNED_USERS
      FROM DUAL
    `;
    const result = await executeQuery(sql);
    return result.rows[0] || {
      PENDING_TASKS: 0,
      PENDING_ROLE_REQUESTS: 0,
      BANNED_USERS: 0
    };
  },

  // Get admin metrics
  async getAdminMetrics() {
    const metrics = await this.getDashboardMetrics();
    const sql = `
      SELECT 
        (SELECT COUNT(*) FROM USERS u JOIN ROLES r ON u.ROLE_ID = r.ROLE_ID WHERE LOWER(r.ROLE_NAME) = 'moderator' AND u.IS_ACTIVE = 0) as PENDING_MODERATORS,
        (SELECT COUNT(*) FROM USERS) as TOTAL_USERS,
        (SELECT COUNT(*) FROM TASKS) as TOTAL_TASKS
      FROM DUAL
    `;
    const result = await executeQuery(sql);
    return {
      ...metrics,
      ...result.rows[0]
    };
  },

  // Get token usage by user
  async getTokenUsageByUser(userId) {
    const sql = `
      SELECT 
        TRUNC(SESSION_DATE) as DATE_,
        SUM(TOKENS_USED) as TOKENS
      FROM LLM_SESSIONS
      WHERE USER_ID = :userId
      AND SESSION_DATE >= SYSDATE - 30
      GROUP BY TRUNC(SESSION_DATE)
      ORDER BY DATE_ DESC
    `;
    const result = await executeQuery(sql, [userId]);
    return result.rows;
  },

  // Get subscription stats
  async getSubscriptionStats() {
    const sql = `
      SELECT 
        sp.PLAN_NAME,
        COUNT(us.SUBSCRIPTION_ID) as SUBSCRIBER_COUNT,
        SUM(sp.PRICE) as TOTAL_REVENUE
      FROM SUBSCRIPTION_PLANS sp
      LEFT JOIN USER_SUBSCRIPTIONS us ON sp.PLAN_ID = us.PLAN_ID AND us.END_DATE > SYSDATE
      GROUP BY sp.PLAN_NAME, sp.PLAN_ID
      ORDER BY SUBSCRIBER_COUNT DESC
    `;
    const result = await executeQuery(sql);
    return result.rows;
  }
};

module.exports = metricsRepository;
