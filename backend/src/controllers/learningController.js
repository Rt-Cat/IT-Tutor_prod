const techRepo = require('../repositories/technologyRepository');
const courseRepo = require('../repositories/courseRepository');
const taskRepo = require('../repositories/taskRepository');

class LearningController {
  // --- Technologies Execution Handlers ---
  async getTechnologies(req, res, next) {
    try {
      const data = await techRepo.findAll();
      res.json(data);
    } catch (err) { next(err); }
  }

  async createTechnology(req, res, next) {
    try {
      const { name, category, description } = req.body;
      await techRepo.create({ name, category, description });
      res.status(201).json({ message: 'Technology indexed successfully.' });
    } catch (err) { next(err); }
  }

  // --- Courses Execution Handlers ---
  async getCourses(req, res, next) {
    try {
      const data = await courseRepo.findAll();
      res.json(data);
    } catch (err) { next(err); }
  }

  async createCourse(req, res, next) {
    try {
      const { technologyId, title, description, levelType, isPublished } = req.body;
      const createdBy = req.user.userId; // Extracted via JWT middleware
      await courseRepo.create({ technologyId, title, description, levelType, isPublished, createdBy });
      res.status(201).json({ message: 'Learning course spawned successfully.' });
    } catch (err) { next(err); }
  }

  async updateCourse(req, res, next) {
    try {
      const { id } = req.params;
      const { technologyId, title, description, levelType, isPublished } = req.body;
      await courseRepo.update(id, { technologyId, title, description, levelType, isPublished });
      res.json({ message: 'Course parameters updated successfully.' });
    } catch (err) { next(err); }
  }

  // --- Tasks & System Prompts Execution Handlers ---
  async getTasksByCourse(req, res, next) {
    try {
      const { courseId } = req.params;
      const data = await taskRepo.findByCourseId(courseId);
      res.json(data);
    } catch (err) { next(err); }
  }

  async createTask(req, res, next) {
    try {
      const { courseId, title, taskDescription, difficulty, estimatedMinutes, isFree, isPublished, sortOrder } = req.body;
      await taskRepo.create({ courseId, title, taskDescription, difficulty, estimatedMinutes, isFree, isPublished, sortOrder });
      res.status(201).json({ message: 'AI Coding Task generated successfully.' });
    } catch (err) { next(err); }
  }

  async addTaskPrompt(req, res, next) {
    try {
      const { taskId } = req.params;
      const { promptType, promptContent } = req.body;
      await taskRepo.createPrompt({ taskId, promptType, promptContent });
      res.status(201).json({ message: 'LLM behavioral target directive added.' });
    } catch (err) { next(err); }
  }

  async updateTechnology(req, res, next) {
    try {
      const { id } = req.params;
      const { name, category, description } = req.body;
      if (!name) return res.status(400).json({ error: 'Technology name is mandatory.' });
      
      await techRepo.update(id, { name, category, description });
      res.json({ message: 'Technology parameters successfully updated.' });
    } catch (err) { next(err); }
  }

  async updateTask(req, res, next) {
    try {
      const { id } = req.params;
      const { title, taskDescription, difficulty, estimatedMinutes, isFree, isPublished, sortOrder } = req.body;
      
      await taskRepo.update(id, { title, taskDescription, difficulty, estimatedMinutes, isFree, isPublished, sortOrder });
      res.json({ message: 'Coding challenge configurations updated.' });
    } catch (err) { next(err); }
  }
}

module.exports = new LearningController();