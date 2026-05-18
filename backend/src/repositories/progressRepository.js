const db = require('../config/db');

class ProgressRepository {
  async upsertTaskProgress({ userId, taskId, status, score, feedback }) {
    // Uses Oracle MERGE to handle inserts and updates within a single atomic query execution block
    const sql = `
      MERGE INTO Progress p
      USING DUAL ON (p.UserID = :userId AND p.TaskID = :taskId)
      WHEN MATCHED THEN
        UPDATE SET p.Status = :status, p.Score = :score, p.LastLLMFeedback = :feedback, 
                   p.Attempts = p.Attempts + 1, p.UpdatedAt = CURRENT_TIMESTAMP,
                   p.CompletedAt = CASE WHEN :status = 'completed' THEN CURRENT_TIMESTAMP ELSE p.CompletedAt END
      WHEN NOT MATCHED THEN
        INSERT (UserID, TaskID, Status, Score, Attempts, LastLLMFeedback, StartedAt)
        VALUES (:userId, :taskId, :status, :score, 1, :feedback, CURRENT_TIMESTAMP)
    `;
    return await db.execute(sql, { userId, taskId, status, score, feedback });
  }

  async recordLLMSession({ userId, profileId, taskId, promptTokens, responseTokens, modelName, status }) {
    const sql = `
      INSERT INTO LLMSessions (UserID, ProfileID, TaskID, PromptTokens, ResponseTokens, ModelName, Status, FinishedAt)
      VALUES (:userId, :profileId, :taskId, :promptTokens, :responseTokens, :modelName, :status, CURRENT_TIMESTAMP)
    `;
    return await db.execute(sql, { userId, profileId, taskId, promptTokens, responseTokens, modelName, status });
  }

  async getDailyTokenCount(userId) {
    const sql = `
      SELECT NVL(SUM(PromptTokens + ResponseTokens), 0) as DAILY_TOKENS 
      FROM LLMSessions 
      WHERE UserID = :userId AND StartedAt >= TRUNC(CURRENT_TIMESTAMP)
    `;
    const result = await db.execute(sql, { userId });
    return result.rows[0].DAILY_TOKENS;
  }
}

module.exports = new ProgressRepository();