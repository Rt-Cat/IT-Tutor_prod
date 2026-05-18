const profileRepo = require('../repositories/profileRepository');
const techRepo = require('../repositories/technologyRepository');
const subRepo = require('../repositories/subscriptionRepository');
const progressRepo = require('../repositories/progressRepository');

class ProfileController {
  async getProfiles(req, res, next) {
    try {
      const data = await profileRepo.findAll();
      res.json(data);
    } catch (err) { next(err); }
  }

  async createProfile(req, res, next) {
    try {
      const { profileName, description, preferredDifficulty, aiThinkingMode, isDefault } = req.body;
      
      if (isDefault === 1) {
        await profileRepo.resetDefaults();
      }
      
      await profileRepo.create({ profileName, description, preferredDifficulty, aiThinkingMode, isDefault });
      res.status(201).json({ message: 'LLM configuration behavior matrix built.' });
    } catch (err) { next(err); }
  }

  async linkTechnologyToProfile(req, res, next) {
    try {
      const { profileId } = req.params;
      const { technologyId, priorityLevel } = req.body;
      await techRepo.linkToProfile({ profileId, technologyId, priorityLevel });
      res.status(201).json({ message: 'Technology domain linked to LLM agent matrix profile.' });
    } catch (err) { next(err); }
  }

  async applySubscription(req, res, next) {
    try {
      const { planId, durationDays } = req.body;
      const userId = req.user.userId;
      await subRepo.createUserSubscription({ userId, planId, durationDays: durationDays || 30 });
      res.json({ message: 'Subscription token balance successfully applied to user account.' });
    } catch (err) { next(err); }
  }

  async evaluateTaskSubmission(req, res, next) {
    try {
      const userId = req.user.userId;
      const { taskId, profileId, sourceCode } = req.body;
      
      if (!taskId || !sourceCode) {
        return res.status(400).json({ error: 'Code content and target task are required.' });
      }

      // 1. Subscription Verification Layer
      const activeSub = await subRepo.findActiveUserSubscription(userId);
      const currentUsage = await progressRepo.getDailyTokenCount(userId);
      
      // Default to Free Tier limits (10 tokens) if no active subscription plan is mapped
      const allowedLimit = activeSub ? activeSub.DAILYLLMLIMIT : 10;
      if (currentUsage >= allowedLimit) {
        return res.status(429).json({ error: 'Daily LLM resource allocation exhausted for this billing cycle.' });
      }

      // 2. Simulated AI Mentor Output Evaluation Loop
      // In production, replace this with your actual external LLM API fetch connection request
      const calculatedScore = Math.floor(Math.random() * 40) + 61; // Generates a sample score between 61 and 100
      const mockFeedback = `AI Analysis: Code uses secure structures. Integration boundaries map to Variant 7 metrics. Execution verified.`;
      const finalStatus = calculatedScore >= 75 ? 'completed' : 'failed';

      // 3. Persist State Records to Oracle DB
      await progressRepo.upsertTaskProgress({
        userId, taskId, status: finalStatus, score: calculatedScore, feedback: mockFeedback
      });

      await progressRepo.recordLLMSession({
        userId, profileId: profileId || null, taskId,
        promptTokens: 120, responseTokens: 250, // Static token metrics simulation
        modelName: 'gpt-4o-coding-strict', status: 'completed'
      });

      res.json({
        success: true,
        status: finalStatus,
        score: calculatedScore,
        feedback: mockFeedback
      });
    } catch (err) { next(err); }
  }
}

module.exports = new ProfileController();