const db = require('../config/db');

class MetricsRepository {
  async getGlobalAnalytics() {
    const sql = `
      SELECT 
        (SELECT COUNT(*) FROM Users) as TOTAL_USERS,
        (SELECT COUNT(*) FROM Courses) as TOTAL_COURSES,
        (SELECT COUNT(*) FROM LLMSessions WHERE Status = 'active') as ACTIVE_AI_SESSIONS,
        (SELECT NVL(SUM(PromptTokens + ResponseTokens), 0) FROM LLMSessions) as COMBINED_TOKENS_USED
      FROM DUAL
    `;
    const result = await db.execute(sql);
    return result.rows[0];
  }

  async getModeratorOverview() {
    const sql = `
      SELECT 
        PlanID, Name, DailyLLMLimit, 
        (SELECT COUNT(*) FROM Subscriptions s WHERE s.PlanID = p.PlanID AND s.Status = 'active') as ACTIVE_SUBSCRIBERS
      FROM SubscriptionPlans p
    `;
    const result = await db.execute(sql);
    return result.rows;
  }
}

module.exports = new MetricsRepository();