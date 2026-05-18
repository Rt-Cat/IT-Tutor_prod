const db = require('../config/db');

class SubscriptionRepository {
  async findAllPlans() {
    const sql = `SELECT PlanID, Name, Description, MonthlyPrice, DailyLLMLimit FROM SubscriptionPlans ORDER BY MonthlyPrice ASC`;
    const result = await db.execute(sql);
    return result.rows;
  }

  async findActiveUserSubscription(userId) {
    const sql = `
      SELECT SubscriptionID, PlanID, StartDate, ExpiryDate, Status 
      FROM Subscriptions 
      WHERE UserID = :userId AND Status = 'active' AND ExpiryDate >= CURRENT_DATE
    `;
    const result = await db.execute(sql, { userId });
    return result.rows[0];
  }

  async createUserSubscription({ userId, planId, durationDays }) {
    const sql = `
      INSERT INTO Subscriptions (UserID, PlanID, ExpiryDate, Status)
      VALUES (:userId, :planId, CURRENT_DATE + :durationDays, 'active')
    `;
    return await db.execute(sql, { userId, planId, durationDays });
  }

  async updateSubscriptionStatus(subscriptionId, status) {
    const sql = `UPDATE Subscriptions SET Status = :status WHERE SubscriptionID = :subscriptionId`;
    return await db.execute(sql, { subscriptionId, status });
  }
}

module.exports = new SubscriptionRepository();