const db = require('../config/db');

class StudentController {
  async getDashboardData(req, res, next) {
    try {
      const userId = req.user.userId;

      // 1. Персональний прогрес (Активні/Пройдені таски з прив'язкою до технологій)
      const progressSql = `
        SELECT 
          p.Status, p.Score, p.Attempts, p.StartedAt, p.CompletedAt,
          t.Title AS TaskTitle, t.Difficulty,
          c.Title AS CourseTitle,
          tech.Name AS TechName
        FROM Progress p
        JOIN Tasks t ON p.TaskID = t.TaskID
        JOIN Courses c ON t.CourseID = c.CourseID
        JOIN Technologies tech ON c.TechnologyID = tech.TechnologyID
        WHERE p.UserID = :userId
        ORDER BY p.UpdatedAt DESC
      `;
      const progressResult = await db.execute(progressSql, { userId });

      // 2. Scoreboard (Рейтинг Топ-10 студентів за сумарним балом)
      const scoreboardSql = `
        SELECT 
          u.UserID, u.Email, SUM(p.Score) as TotalScore
        FROM Users u
        JOIN Progress p ON u.UserID = p.UserID
        WHERE u.Role = 'student'
        GROUP BY u.UserID, u.Email
        ORDER BY TotalScore DESC
        FETCH FIRST 10 ROWS ONLY
      `;
      const scoreboardResult = await db.execute(scoreboardSql, {});

      res.json({
        myProgress: progressResult.rows,
        scoreboard: scoreboardResult.rows
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new StudentController();