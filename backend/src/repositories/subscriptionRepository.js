const db = require('../config/db');

class SubscriptionRepository {
  async findAllPlans() {
    const sql = `SELECT PlanID, Name, Description, MonthlyPrice, DailyLLMLimit, HasFullAccess FROM SubscriptionPlans ORDER BY MonthlyPrice ASC`;
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
  // Отримання списку всіх підписок у системі для модератора
  async getAllSubscriptionsForModerator() {
    const sql = `
      SELECT 
        s.SubscriptionID, s.UserID, u.Email as UserEmail,
        p.Name as PlanName, p.PlanID,
        TO_CHAR(s.ExpiryDate, 'DD.MM.YYYY') as ExpDate, s.Status
      FROM Subscriptions s
      JOIN Users u ON s.UserID = u.UserID
      JOIN SubscriptionPlans p ON s.PlanID = p.PlanID
      ORDER BY s.CreatedAt DESC
    `;
    const result = await db.execute(sql);
    return result.rows;
  }

  // Розширене оновлення статусу (з можливістю зміни тарифного плану при апгрейді)
  async updateSubscriptionByModerator(subId, status, planId = null) {
    let sql = `UPDATE Subscriptions SET Status = :status`;
    const params = { status, subId };
    
    if (planId) {
      sql += `, PlanID = :planId`;
      params.planId = planId;
    }
    sql += ` WHERE SubscriptionID = :subId`;
    
    await db.execute(sql, params);
  }

  // --- УПРАВЛІННЯ ПЛАНАМИ (SubscriptionPlans) ---
  async createPlan({ name, description, monthlyPrice, hasFullAccess, dailyLlmLimit }) {
    const sql = `
      INSERT INTO SubscriptionPlans (Name, Description, MonthlyPrice, HasFullAccess, DailyLLMLimit)
      VALUES (:name, :description, :monthlyPrice, :hasFullAccess, :dailyLlmLimit)
    `;
    return await db.execute(sql, { name, description, monthlyPrice, hasFullAccess, dailyLlmLimit });
  }

  async updatePlan(planId, { name, description, monthlyPrice, hasFullAccess, dailyLlmLimit }) {
    const sql = `
      UPDATE SubscriptionPlans 
      SET Name = :name, Description = :description, MonthlyPrice = :monthlyPrice, 
          HasFullAccess = :hasFullAccess, DailyLLMLimit = :dailyLlmLimit
      WHERE PlanID = :planId
    `;
    return await db.execute(sql, { planId, name, description, monthlyPrice, hasFullAccess, dailyLlmLimit });
  }

  // --- УПРАВЛІННЯ ПІДПИСКАМИ КОРИСТУВАЧІВ ---
  async grantSubscriptionToUser({ userId, planId, durationDays }) {
    const sql = `
      INSERT INTO Subscriptions (UserID, PlanID, StartDate, ExpiryDate, Status, AutoRenew)
      VALUES (:userId, :planId, CURRENT_DATE, CURRENT_DATE + :durationDays, 'active', 0)
    `;
    return await db.execute(sql, { userId, planId, durationDays });
  }

  async deleteSubscription(subId) {
    const sql = `DELETE FROM Subscriptions WHERE SubscriptionID = :subId`;
    return await db.execute(sql, { subId });
  }

  // --- ДОСТУП ДО ЗАДАЧ (TaskAccessRules) ---
  async upsertTaskAccessRule({ taskId, planId, isAccessible }) {
    // Перевіряємо, чи існує правило, якщо так - оновлюємо, інакше - створюємо
    const checkSql = `SELECT AccessRuleID FROM TaskAccessRules WHERE TaskID = :taskId AND PlanID = :planId`;
    const result = await db.execute(checkSql, { taskId, planId });
    
    if (result.rows.length > 0) {
      const sql = `UPDATE TaskAccessRules SET IsAccessible = :isAccessible WHERE TaskID = :taskId AND PlanID = :planId`;
      return await db.execute(sql, { isAccessible, taskId, planId });
    } else {
      const sql = `INSERT INTO TaskAccessRules (TaskID, PlanID, IsAccessible) VALUES (:taskId, :planId, :isAccessible)`;
      return await db.execute(sql, { taskId, planId, isAccessible });
    }
  }

  async getTaskAccessRules() {
    const sql = `
      SELECT r.AccessRuleID, r.TaskID, t.Title as TaskTitle, r.PlanID, p.Name as PlanName, r.IsAccessible
      FROM TaskAccessRules r
      JOIN Tasks t ON r.TaskID = t.TaskID
      JOIN SubscriptionPlans p ON r.PlanID = p.PlanID
      ORDER BY r.TaskID DESC
    `;
    const result = await db.execute(sql);
    return result.rows;
  }
  
}

module.exports = new SubscriptionRepository();