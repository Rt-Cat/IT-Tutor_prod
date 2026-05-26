const { executeQuery, oracledb } = require('../db');

const subscriptionRepository = {
  // Get all subscription plans
  async getPlans() {
    const sql = `
      SELECT PLAN_ID, PLAN_NAME, PRICE, TOKEN_LIMIT, DURATION_DAYS, FEATURES, IS_ACTIVE
      FROM SUBSCRIPTION_PLANS
      WHERE IS_ACTIVE = 1
      ORDER BY PRICE
    `;
    const result = await executeQuery(sql);
    return result.rows;
  },

  // Get plan by ID
  async getPlanById(id) {
    const sql = `
      SELECT PLAN_ID, PLAN_NAME, PRICE, TOKEN_LIMIT, DURATION_DAYS, FEATURES, IS_ACTIVE
      FROM SUBSCRIPTION_PLANS
      WHERE PLAN_ID = :id
    `;
    const result = await executeQuery(sql, [id]);
    return result.rows[0] || null;
  },

  // Get user's active subscription
  async getUserSubscription(userId) {
    const sql = `
      SELECT us.SUBSCRIPTION_ID, us.START_DATE, us.END_DATE, us.TOKENS_REMAINING,
             sp.PLAN_NAME, sp.TOKEN_LIMIT, sp.PRICE
      FROM USER_SUBSCRIPTIONS us
      JOIN SUBSCRIPTION_PLANS sp ON us.PLAN_ID = sp.PLAN_ID
      WHERE us.USER_ID = :userId
      AND us.END_DATE > SYSDATE
      ORDER BY us.END_DATE DESC
      FETCH FIRST 1 ROW ONLY
    `;
    const result = await executeQuery(sql, [userId]);
    return result.rows[0] || null;
  },

  // Create subscription for user
  async createSubscription(userId, planId) {
    const plan = await this.getPlanById(planId);
    if (!plan) throw new Error('Plan not found');

    const sql = `
      INSERT INTO USER_SUBSCRIPTIONS (USER_ID, PLAN_ID, START_DATE, END_DATE, TOKENS_REMAINING)
      VALUES (:userId, :planId, SYSDATE, SYSDATE + :durationDays, :tokenLimit)
      RETURNING SUBSCRIPTION_ID INTO :subscriptionId
    `;
    const result = await executeQuery(sql, {
      userId,
      planId,
      durationDays: plan.DURATION_DAYS,
      tokenLimit: plan.TOKEN_LIMIT,
      subscriptionId: { type: oracledb.NUMBER, dir: oracledb.BIND_OUT }
    });
    return result.outBinds.subscriptionId[0];
  },

  // Update tokens remaining
  async updateTokens(subscriptionId, tokensUsed) {
    const sql = `
      UPDATE USER_SUBSCRIPTIONS 
      SET TOKENS_REMAINING = TOKENS_REMAINING - :tokensUsed
      WHERE SUBSCRIPTION_ID = :subscriptionId
      AND TOKENS_REMAINING >= :tokensUsed
    `;
    const result = await executeQuery(sql, { subscriptionId, tokensUsed });
    return result.rowsAffected > 0;
  },

  // Get subscription statistics (for admin)
  async getStats() {
    const sql = `
      SELECT 
        sp.PLAN_NAME,
        COUNT(us.SUBSCRIPTION_ID) as ACTIVE_SUBSCRIBERS,
        SUM(sp.PRICE) as MONTHLY_REVENUE
      FROM SUBSCRIPTION_PLANS sp
      LEFT JOIN USER_SUBSCRIPTIONS us ON sp.PLAN_ID = us.PLAN_ID AND us.END_DATE > SYSDATE
      WHERE sp.IS_ACTIVE = 1
      GROUP BY sp.PLAN_NAME, sp.PLAN_ID
      ORDER BY sp.PLAN_ID
    `;
    const result = await executeQuery(sql);
    return result.rows;
  },

  // Create subscription plan (admin)
  async createPlan({ planName, price, tokenLimit, durationDays, features }) {
    const sql = `
      INSERT INTO SUBSCRIPTION_PLANS (PLAN_NAME, PRICE, TOKEN_LIMIT, DURATION_DAYS, FEATURES, IS_ACTIVE)
      VALUES (:planName, :price, :tokenLimit, :durationDays, :features, 1)
      RETURNING PLAN_ID INTO :planId
    `;
    const result = await executeQuery(sql, {
      planName,
      price,
      tokenLimit,
      durationDays,
      features,
      planId: { type: oracledb.NUMBER, dir: oracledb.BIND_OUT }
    });
    return result.outBinds.planId[0];
  },

  // Update subscription plan (admin)
  async updatePlan(id, updates) {
    const fields = [];
    const binds = { id };

    if (updates.planName) {
      fields.push('PLAN_NAME = :planName');
      binds.planName = updates.planName;
    }
    if (updates.price !== undefined) {
      fields.push('PRICE = :price');
      binds.price = updates.price;
    }
    if (updates.tokenLimit) {
      fields.push('TOKEN_LIMIT = :tokenLimit');
      binds.tokenLimit = updates.tokenLimit;
    }
    if (updates.isActive !== undefined) {
      fields.push('IS_ACTIVE = :isActive');
      binds.isActive = updates.isActive ? 1 : 0;
    }

    if (fields.length === 0) return false;

    const sql = `UPDATE SUBSCRIPTION_PLANS SET ${fields.join(', ')} WHERE PLAN_ID = :id`;
    const result = await executeQuery(sql, binds);
    return result.rowsAffected > 0;
  }
};

module.exports = subscriptionRepository;