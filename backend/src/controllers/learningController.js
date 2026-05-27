const technologyRepository = require('../repositories/technologyRepository');
const courseRepository = require('../repositories/courseRepository');
const taskRepository = require('../repositories/taskRepository');
const subscriptionRepository = require('../repositories/subscriptionRepository');

const learningController = {
  // Get all technologies
  async getTechnologies(req, res, next) {
    try {
      const technologies = await technologyRepository.findAllWithCourseCount();
      res.json(technologies);
    } catch (error) {
      next(error);
    }
  },

  // Get all courses
  async getCourses(req, res, next) {
    try {
      const { page, limit, technologyId } = req.query;
      const courses = await courseRepository.findAll({
        page: parseInt(page) || 1,
        limit: parseInt(limit) || 20,
        technologyId: technologyId ? parseInt(technologyId) : null
      });
      res.json(courses);
    } catch (error) {
      next(error);
    }
  },

  // Get course by ID
  async getCourseById(req, res, next) {
    try {
      const course = await courseRepository.findById(req.params.id);
      if (!course) {
        return res.status(404).json({ error: 'Course not found' });
      }
      res.json(course);
    } catch (error) {
      next(error);
    }
  },

  // Create course
  async createCourse(req, res, next) {
    try {
      const { courseName, description, techId } = req.body;

      if (!courseName || !techId) {
        return res.status(400).json({ error: 'Course name and technology are required' });
      }

      const courseId = await courseRepository.create({
        courseName,
        description,
        techId,
        instructorId: req.user.id
      });

      const course = await courseRepository.findById(courseId);
      res.status(201).json(course);
    } catch (error) {
      next(error);
    }
  },

  // Update course
  async updateCourse(req, res, next) {
    try {
      const { courseName, description, techId, isActive } = req.body;

      const success = await courseRepository.update(req.params.id, {
        courseName,
        description,
        techId,
        isActive
      });

      if (!success) {
        return res.status(404).json({ error: 'Course not found or no changes made' });
      }

      const course = await courseRepository.findById(req.params.id);
      res.json(course);
    } catch (error) {
      next(error);
    }
  },

  // Delete course
  async deleteCourse(req, res, next) {
    try {
      const success = await courseRepository.delete(req.params.id);
      if (!success) {
        return res.status(404).json({ error: 'Course not found' });
      }
      res.json({ message: 'Course deleted successfully' });
    } catch (error) {
      next(error);
    }
  },

  // Get all tasks
  async getTasks(req, res, next) {
    try {
      const { page, limit, status, courseId, difficulty } = req.query;
      const tasks = await taskRepository.findAll({
        page: parseInt(page) || 1,
        limit: parseInt(limit) || 20,
        status: status || 'approved',
        courseId: courseId ? parseInt(courseId) : null,
        difficulty
      });
      res.json(tasks);
    } catch (error) {
      next(error);
    }
  },

  // Get task by ID
  async getTaskById(req, res, next) {
    try {
      const task = await taskRepository.findById(req.params.id);
      if (!task) {
        return res.status(404).json({ error: 'Task not found' });
      }
      res.json(task);
    } catch (error) {
      next(error);
    }
  },

  // Create task
  async createTask(req, res, next) {
    try {
      const { title, description, courseId, difficultyLevel, estimatedMinutes, isFree } = req.body;

      if (!title || !courseId) {
        return res.status(400).json({ error: 'Title and course are required' });
      }

      const taskId = await taskRepository.create({
        title,
        description,
        courseId,
        difficultyLevel: difficultyLevel || 'medium',
        estimatedMinutes: estimatedMinutes || 15,
        isFree: isFree || false,
        createdBy: req.user.id
      });

      const task = await taskRepository.findById(taskId);
      res.status(201).json(task);
    } catch (error) {
      next(error);
    }
  },

  // Update task
  async updateTask(req, res, next) {
    try {
      const { title, description, difficultyLevel, estimatedMinutes, isFree, status } = req.body;

      const success = await taskRepository.update(req.params.id, {
        title,
        description,
        difficultyLevel,
        estimatedMinutes,
        isFree,
        status
      });

      if (!success) {
        return res.status(404).json({ error: 'Task not found or no changes made' });
      }

      const task = await taskRepository.findById(req.params.id);
      res.json(task);
    } catch (error) {
      next(error);
    }
  },

  // Delete task
  async deleteTask(req, res, next) {
    try {
      const success = await taskRepository.delete(req.params.id);
      if (!success) {
        return res.status(404).json({ error: 'Task not found' });
      }
      res.json({ message: 'Task deleted successfully' });
    } catch (error) {
      next(error);
    }
  },

  // Get subscription plans
  async getSubscriptionPlans(req, res, next) {
    try {
      const plans = await subscriptionRepository.getPlans();
      res.json(plans);
    } catch (error) {
      next(error);
    }
  },

  // Get my subscription
  async getMySubscription(req, res, next) {
    try {
      const subscription = await subscriptionRepository.getUserSubscription(req.user.id);
      res.json(subscription || { message: 'No active subscription' });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = learningController;
