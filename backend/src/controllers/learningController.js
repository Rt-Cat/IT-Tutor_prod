const techRepo = require('../repositories/technologyRepository');
const courseRepo = require('../repositories/courseRepository');
const taskRepo = require('../repositories/taskRepository');

const db = require('../config/db');

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

  // Отримання повного або відфільтрованого дерева контенту
  async getContentTree(req, res, next) {
    try {
      const role = req.user.role;
      const userId = req.user.userId;

      // Базовий SQL для отримання всієї ієрархії
      let sql = `
        SELECT 
          t.TechnologyID, t.Name AS TechName,
          c.CourseID, c.Title AS CourseTitle, c.IsPublished AS CoursePublished,
          ts.TaskID, ts.Title AS TaskTitle, ts.Difficulty, ts.IsFree
        FROM Technologies t
        LEFT JOIN Courses c ON t.TechnologyID = c.TechnologyID
        LEFT JOIN Tasks ts ON c.CourseID = ts.CourseID
      `;

      // Фільтрація для інструктора (наприклад, тільки опубліковані курси та безкоштовні таски, 
      // або те, що належить до його підписки. Для прикладу - фільтруємо за IsPublished).
      // Модератор бачить усе без умов WHERE.
      if (role === 'instructor') {
        sql += ` WHERE c.IsPublished = 1 OR c.IsPublished IS NULL`; 
        // Додайте тут логіку перевірки підписки інструктора, якщо потрібно
      }

      sql += ` ORDER BY t.Name, c.Title, ts.SortOrder`;

      const result = await db.execute(sql, {});
      
      // Форматування плоского SQL-результату у JSON Дерево
      const tree = {};
      
      result.rows.forEach(row => {
        // 1. Рівень: Технологія
        if (!tree[row.TECHNOLOGYID]) {
          tree[row.TECHNOLOGYID] = {
            id: row.TECHNOLOGYID,
            name: row.TECHNAME,
            courses: {}
          };
        }
        
        // 2. Рівень: Курс
        if (row.COURSEID && !tree[row.TECHNOLOGYID].courses[row.COURSEID]) {
          tree[row.TECHNOLOGYID].courses[row.COURSEID] = {
            id: row.COURSEID,
            title: row.COURSETITLE,
            isPublished: row.COURSEPUBLISHED,
            tasks: []
          };
        }

        // 3. Рівень: Завдання
        if (row.TASKID) {
          tree[row.TECHNOLOGYID].courses[row.COURSEID].tasks.push({
            id: row.TASKID,
            title: row.TASKTITLE,
            difficulty: row.DIFFICULTY,
            isFree: row.ISFREE
          });
        }
      });

      // Перетворюємо об'єкти в масиви для зручності фронтенду
      const finalTree = Object.values(tree).map(tech => ({
        ...tech,
        courses: Object.values(tech.courses)
      }));

      res.json(finalTree);
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new LearningController();