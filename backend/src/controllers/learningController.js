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
      let { technologyId, title, description, levelType, isPublished } = req.body;
      const createdBy = req.user.userId; 
      const role = req.user.role;

      // БІЗНЕС-ЛОГІКА: Інструктор завжди створює неопублікований курс
      if (role === 'instructor') {
          isPublished = 0; 
      }

      await courseRepo.create({ technologyId, title, description, levelType, isPublished: isPublished || 0, createdBy });
      res.status(201).json({ message: 'Курс успішно створено. Очікує підтвердження модератором.' });
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
      let { courseId, title, taskDescription, difficulty, estimatedMinutes, isFree, isPublished, sortOrder } = req.body;
      const role = req.user.role;
      
      if (parseInt(estimatedMinutes) < 1) {
        return res.status(400).json({ error: 'Estimated time must be at least 1 minute.' });
      }

      // БІЗНЕС-ЛОГІКА: Інструктор завжди створює неопубліковану задачу
      if (role === 'instructor') {
          isPublished = 0;
      }

      await taskRepo.create({ courseId, title, taskDescription, difficulty, estimatedMinutes, isFree, isPublished: isPublished || 0, sortOrder: sortOrder || 1 });
      res.status(201).json({ message: 'Задачу успішно додано. Очікує підтвердження модератором.' });
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
      
      const role = req.user.role;
      // Якщо інструктор редагує технологію, вона знову йде на модерацію
      const isPublished = (role === 'instructor') ? 0 : 1; 

      await techRepo.update(id, { name, category, description, isPublished });
      res.json({ message: 'Technology parameters successfully updated. Awaiting moderation if instructor.' });
    } catch (err) { next(err); }
  }

  async updateTask(req, res, next) {
    try {
      const { id } = req.params;
      const { title, taskDescription, difficulty, estimatedMinutes, isFree, sortOrder } = req.body;
      const role = req.user.role;
      
      // БІЗНЕС-ЛОГІКА: При будь-якому редагуванні інструктором задача знову йде на модерацію (0)
      const isPublished = (role === 'instructor') ? 0 : req.body.isPublished;

      await taskRepo.update(id, { 
        title, 
        taskDescription, 
        difficulty, 
        estimatedMinutes, 
        isFree: isFree ? parseInt(isFree) : 0, 
        isPublished: isPublished !== undefined ? isPublished : 0, 
        sortOrder: sortOrder || 1 
      });
      res.json({ message: 'Task updated and returned to moderation queue.' });
    } catch (err) { next(err); }
  }

  async approveCourse(req, res, next) {
    try {
      const { id } = req.params;
      await courseRepo.approve(id);
      res.json({ message: 'Course approved successfully.' });
    } catch (err) { next(err); }
  }

  async getTasks(req, res, next) {
    try {
      const data = await taskRepo.findAll();
      res.json(data);
    } catch (err) { next(err); }
  }

  async approveTask(req, res, next) {
    try {
      const { id } = req.params;
      await taskRepo.updateStatus(id, 1);
      res.json({ message: 'Task approved successfully.' });
    } catch (err) { next(err); }
  }

  async rejectTask(req, res, next) {
    try {
      const { id } = req.params;
      await taskRepo.updateStatus(id, 2); // 2 = Відхилено
      res.json({ message: 'Task rejected and status set to 2.' });
    } catch (err) { next(err); }
  }

  // Отримання повного або відфільтрованого дерева контенту
  async getContentTree(req, res, next) {
    try {
      const role = req.user.role;

      // Інструктори та Модератори повинні бачити УСЕ (щоб редагувати)
      let sql = `
        SELECT 
          t.TechnologyID, t.Name AS TechName,
          c.CourseID, c.Title AS CourseTitle, c.IsPublished AS CoursePublished,
          ts.TaskID, ts.Title AS TaskTitle, ts.Difficulty, ts.IsFree, ts.IsPublished AS TaskPublished
        FROM Technologies t
        LEFT JOIN Courses c ON t.TechnologyID = c.TechnologyID
        LEFT JOIN Tasks ts ON c.CourseID = ts.CourseID
      `;

      // Якщо це запит від Студента - він бачить ТІЛЬКИ опубліковане
      if (role === 'student') {
        sql += ` WHERE c.IsPublished = 1 AND ts.IsPublished = 1 `; 
      }

      sql += ` ORDER BY t.Name, c.Title, ts.SortOrder`;

      const result = await db.execute(sql, {});
      
      const tree = {};
      result.rows.forEach(row => {
        if (!tree[row.TECHNOLOGYID]) {
          tree[row.TECHNOLOGYID] = { id: row.TECHNOLOGYID, name: row.TECHNAME, courses: {} };
        }
        if (row.COURSEID && !tree[row.TECHNOLOGYID].courses[row.COURSEID]) {
          tree[row.TECHNOLOGYID].courses[row.COURSEID] = { id: row.COURSEID, title: row.COURSETITLE, isPublished: row.COURSEPUBLISHED, tasks: [] };
        }
        if (row.TASKID) {
          tree[row.TECHNOLOGYID].courses[row.COURSEID].tasks.push({
            id: row.TASKID, title: row.TASKTITLE, difficulty: row.DIFFICULTY, isFree: row.ISFREE, isPublished: row.TASKPUBLISHED
          });
        }
      });

      const finalTree = Object.values(tree).map(tech => ({
        ...tech,
        courses: Object.values(tech.courses)
      }));

      res.json(finalTree);
    } catch (err) { next(err); }
  }
}

module.exports = new LearningController();