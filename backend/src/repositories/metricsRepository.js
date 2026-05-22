const db = require('../config/db');

class MetricsRepository {
  // Для головного дашборду Адміністратора (main.ejs)
  async getGlobalStats() {
    // NVL використовується, щоб повернути 0, якщо таблиця порожня (замість null)
    const usersRes = await db.execute(`SELECT COUNT(UserID) AS TotalUsers FROM Users`);
    const tasksRes = await db.execute(`SELECT COUNT(ProgressID) AS CompletedTasks FROM Progress WHERE Status = 'completed'`);
    const llmRes = await db.execute(`SELECT NVL(SUM(PromptTokens + ResponseTokens), 0) AS TotalTokens FROM LLMSessions`);
    const subsRes = await db.execute(`SELECT COUNT(SubscriptionID) AS ActiveSubs FROM Subscriptions WHERE Status = 'active'`);

    return {
      totalUsers: usersRes.rows[0].TOTALUSERS || 0,
      completedTasks: tasksRes.rows[0].COMPLETEDTASKS || 0,
      totalTokens: llmRes.rows[0].TOTALTOKENS || 0,
      activeSubscriptions: subsRes.rows[0].ACTIVESUBS || 0
    };
  }

  // Розширена статистика для вкладок адміністратора
  async getDetailedAdminStats() {
    // 1. Статистика LLM (використання за моделями)
    const llmStats = await db.execute(`
      SELECT NVL(ModelName, 'Unknown') as Model, COUNT(SessionID) as UsageCount, SUM(PromptTokens + ResponseTokens) as TotalTokens
      FROM LLMSessions
      GROUP BY ModelName
      ORDER BY TotalTokens DESC
    `);

    // 2. Статистика контенту (Курси та задачі)
    const contentStats = await db.execute(`
      SELECT 
        (SELECT COUNT(*) FROM Technologies) as TechCount,
        (SELECT COUNT(*) FROM Courses) as CourseCount,
        (SELECT COUNT(*) FROM Tasks) as TaskCount
      FROM DUAL
    `);

    // 3. Статистика підписок
    const subStats = await db.execute(`
      SELECT p.Name as PlanName, COUNT(s.SubscriptionID) as ActiveUsers
      FROM SubscriptionPlans p
      LEFT JOIN Subscriptions s ON p.PlanID = s.PlanID AND s.Status = 'active'
      GROUP BY p.Name
    `);

    return {
      llmUsage: llmStats.rows.map(r => ({ model: r.MODEL, count: r.USAGECOUNT, tokens: r.TOTALTOKENS })),
      content: {
        technologies: contentStats.rows[0].TECHCOUNT || 0,
        courses: contentStats.rows[0].COURSECOUNT || 0,
        tasks: contentStats.rows[0].TASKCOUNT || 0
      },
      subscriptions: subStats.rows.map(r => ({ plan: r.PLANNAME, users: r.ACTIVEUSERS }))
    };
  }
  // Для панелі Модератора
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
  // Розширені дані для Дашборду Модератора
  async getModeratorDashboardData() {
    // 1. Статистика черги модерації (скільки чекає на апрув)
    const pendingCourses = await db.execute(`SELECT COUNT(CourseID) as PENDING_COURSES FROM Courses WHERE IsPublished = 0`);
    const pendingTasks = await db.execute(`SELECT COUNT(TaskID) as PENDING_TASKS FROM Tasks WHERE IsPublished = 0`);

    // 2. Популярність курсів (рахуємо за кількістю записів у таблиці Прогрес)
    const popularCourses = await db.execute(`
        SELECT c.Title, COUNT(p.ProgressID) as AttemptsCount
        FROM Courses c
        JOIN Tasks t ON c.CourseID = t.CourseID
        JOIN Progress p ON t.TaskID = p.TaskID
        GROUP BY c.Title
        ORDER BY AttemptsCount DESC
        FETCH FIRST 5 ROWS ONLY
    `);

    // 3. Активність інструкторів (хто найбільше створив курсів)
    const instructorActivity = await db.execute(`
        SELECT u.Email, COUNT(c.CourseID) as CreatedCourses
        FROM Users u
        JOIN Courses c ON u.UserID = c.CreatedBy
        WHERE u.Role = 'instructor'
        GROUP BY u.Email, u.UserID
        ORDER BY CreatedCourses DESC
        FETCH FIRST 5 ROWS ONLY
    `);

    // 4. Перегляд останніх взаємодій з ШІ (Промпти/Відгуки)
    const recentAIFeedback = await db.execute(`
        SELECT u.Email, t.Title as TaskTitle, p.Status, TO_CHAR(p.UpdatedAt, 'DD.MM.YYYY HH24:MI') as ActionDate
        FROM Progress p
        JOIN Users u ON p.UserID = u.UserID
        JOIN Tasks t ON p.TaskID = t.TaskID
        WHERE p.LastLLMFeedback IS NOT NULL
        ORDER BY p.UpdatedAt DESC
        FETCH FIRST 5 ROWS ONLY
    `);

    return {
        pending: { 
            courses: pendingCourses.rows[0].PENDING_COURSES || 0, 
            tasks: pendingTasks.rows[0].PENDING_TASKS || 0 
        },
        popularCourses: popularCourses.rows || [],
        instructorActivity: instructorActivity.rows || [],
        recentAIFeedback: recentAIFeedback.rows || []
    };
  }
}

module.exports = new MetricsRepository();