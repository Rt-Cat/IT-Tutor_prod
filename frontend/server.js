const express = require('express');
const cookieParser = require('cookie-parser');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const API_URL = process.env.API_URL || 'http://backend:5000/api';

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Автоматичне інжектування токена та ролі у контекст рендерингу EJS
app.use((req, res, next) => {
  res.locals.userRole = req.cookies.role || null;
  res.locals.token = req.cookies.token || null;
  next();
});

// Налаштування шаблонізатора EJS та статичних папок
app.set('view engine', 'ejs');
app.set('views', './src/views');
app.use(express.static('./src/public'));

// Хелпер для клієнтських HTTP-запитів до Бекенду
const makeRequest = async (endpoint, method = 'GET', body = null, token = null) => {
  try {
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    
    const config = { method, headers };
    if (body) config.body = JSON.stringify(body);

    const res = await fetch(`${API_URL}${endpoint}`, config);
    
    // 1. Перевіряємо, чи бекенд дійсно повернув JSON
    const contentType = res.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      return await res.json();
    } else {
      // Якщо бекенд повернув 404 (HTML), просто повертаємо порожній безпечний об'єкт
      console.warn(`[API Warning]: Ендпоінт ${endpoint} ще не готовий або повернув HTML.`);
      return { error: 'API route not ready', fallback: true };
    }
  } catch (error) {
    // 2. Якщо бекенд взагалі вимкнений або впав (Network Error)
    console.error(`[Network Error] Неможливо достукатися до ${endpoint}:`, error.message);
    return { error: 'Backend unreachable', fallback: true };
  }
};

// =========================================================================
// MIDDLEWARE ДЛЯ КОНТРОЛЮ ДОСТУПУ (RBAC - Role Based Access Control)
// =========================================================================
const authorize = (allowedRoles) => {
  return (req, res, next) => {
    const token = req.cookies.token;
    const userRole = req.cookies.role;

    // 1. Якщо немає токена взагалі — перекидаємо на логін
    if (!token || !userRole) {
      return res.redirect('/auth/login');
    }

    // 2. Якщо роль користувача є в списку дозволених — пускаємо далі
    if (allowedRoles.includes(userRole)) {
      return next();
    }

    // 3. Якщо ролі немає в списку — блокуємо доступ (Красива сторінка 403)
    return res.status(403).send(`
      <!DOCTYPE html>
      <html lang="uk">
      <head>
          <title>403 - Доступ заборонено</title>
          <link rel="stylesheet" href="/css/styles.css">
      </head>
      <body style="display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0;">
          <div style="text-align: center; background: var(--bg-card); padding: 3rem; border-radius: 8px; border: 1px solid var(--error);">
              <h1 style="color: var(--error); font-size: 4rem; margin: 0;">403</h1>
              <h3>Помилка доступу</h3>
              <p style="color: var(--text-muted); margin-bottom: 2rem;">
                  Ваш рівень доступу (<b>${userRole}</b>) не дозволяє переглядати цю сторінку.
              </p>
              <a href="/" class="btn">Повернутися на головну</a>
          </div>
      </body>
      </html>
    `);
  };
};

// =========================================================================
// АВТОРИЗАЦІЯ ТА РЕЄСТРАЦІЯ (AUTH LAYER WITH SESSION REDIRECTS)
// =========================================================================

const redirectIfAuthenticated = (req, res, next) => {
  if (req.cookies && req.cookies.token && req.cookies.role) {
    const role = req.cookies.role;
    if (role === 'admin') return res.redirect('/admin/main');
    if (role === 'moderator') return res.redirect('/moderator/main');
    if (role === 'instructor') return res.redirect('/instructor/tech');
    return res.redirect('/student/workspace');
  }
  next();
};

app.get('/', redirectIfAuthenticated, (req, res) => res.redirect('/auth/login'));

app.get('/auth/login', redirectIfAuthenticated, (req, res) => {
  res.render('auth/login', { error: null, hideNav: true });
});

app.get('/auth/register', redirectIfAuthenticated, async (req, res) => {
  const status = await makeRequest('/auth/admin-exists', 'GET');
  const adminExists = status && status.exists ? true : false;

  res.render('auth/register', { 
    error: null, 
    hideNav: true,
    adminExists: adminExists 
  });
});

app.post('/auth/register', async (req, res) => {
  const data = await makeRequest('/auth/register', 'POST', req.body);
  if (data.error) {
    const status = await makeRequest('/auth/admin-exists', 'GET');
    const adminExists = status && status.exists ? true : false;
    
    return res.render('auth/register', { 
      error: data.error, 
      hideNav: true, 
      adminExists: adminExists 
    });
  }
  res.redirect('/auth/login');
});

app.post('/auth/login', async (req, res) => {
  const data = await makeRequest('/auth/login', 'POST', req.body);
  if (data.error || !data.token) {
    return res.render('auth/login', { error: data.error || 'Невірні дані', hideNav: true });
  }
  
  res.cookie('token', data.token, { httpOnly: true });
  res.cookie('role', data.user.role);

  if (data.user.role === 'admin') return res.redirect('/admin/main');
  if (data.user.role === 'moderator') return res.redirect('/moderator/main');
  if (data.user.role === 'instructor') return res.redirect('/instructor/tech');
  
  res.redirect('/student/workspace');
});

app.get('/auth/logout', (req, res) => {
  res.clearCookie('token');
  res.clearCookie('role');
  res.redirect('/auth/login');
});

// =========================================================================
// СТУДЕНТСЬКИЙ ІНТЕРФЕЙС (STUDENT)
// =========================================================================
app.get('/student/dashboard', authorize(['student', 'instructor', 'moderator', 'admin']), async (req, res) => {
  const token = req.cookies.token;
  const data = await makeRequest('/student/dashboard', 'GET', null, token);
  
  res.render('student/dashboard', { 
    progress: data.myProgress || [], 
    scoreboard: data.scoreboard || [] 
  });
});

app.get('/student/workspace', authorize(['student', 'instructor', 'moderator', 'admin']), async (req, res) => {
  res.render('student/workspace', { taskId: 'Загальна консоль валідації' });
});

app.get('/student/workspace/:taskId', authorize(['student', 'instructor', 'moderator', 'admin']), async (req, res) => {
  const token = req.cookies.token;
  res.render('student/workspace', { taskId: req.params.taskId, token });
});

app.get('/student/profiles', authorize(['student', 'instructor', 'moderator', 'admin']), async (req, res) => {
  const token = req.cookies.token;
  const profilesData = await makeRequest('/profiles', 'GET', null, token);
  res.render('student/profiles', { profiles: profilesData || [] });
});

// =========================================================================
// ІНТЕРФЕЙС ІНСТРУКТОРА (Доступно Інструктору, Модератору та Адміну)
// =========================================================================

// --- 1. ТЕХНОЛОГІЇ ---
app.get('/instructor/tech', authorize(['instructor', 'moderator', 'admin']), async (req, res) => {
  const token = req.cookies.token;
  const treeData = await makeRequest('/learning/tree', 'GET', null, token);
  res.render('instructor/tech', { tree: (treeData && !treeData.error) ? treeData : [] });
});

app.post('/instructor/tech/add', authorize(['instructor', 'admin']), async (req, res) => {
  const token = req.cookies.token;
  await makeRequest('/learning/technologies', 'POST', req.body, token);
  res.redirect('/instructor/tech'); // Перезавантажуємо сторінку після успіху
});
app.post('/instructor/tech/edit/:id', authorize(['instructor', 'admin', 'moderator']), async (req, res) => {
  const token = req.cookies.token;
  await makeRequest(`/learning/technologies/${req.params.id}`, 'PUT', req.body, token);
  res.redirect('/instructor/tech');
});

// --- 2. КУРСИ ---
app.get('/instructor/courses', authorize(['instructor', 'moderator', 'admin']), async (req, res) => {
  const token = req.cookies.token;
  // Отримуємо списки технологій для випадаючого списку та курсів для таблиці
  const techData = await makeRequest('/learning/technologies', 'GET', null, token);
  const coursesData = await makeRequest('/learning/courses', 'GET', null, token);
  
  res.render('instructor/courses', { 
      technologies: (techData && !techData.error) ? techData : [],
      courses: (coursesData && !coursesData.error) ? coursesData : []
  });
});

app.post('/instructor/courses/add', authorize(['instructor', 'admin']), async (req, res) => {
  const token = req.cookies.token;
  // HTML форми з checkbox передають 'on', якщо чекбокс відмічений, робимо конвертацію
  const payload = { ...req.body, isPublished: 0 }; 
  await makeRequest('/learning/courses', 'POST', payload, token);
  res.redirect('/instructor/courses');
});

// --- 3. ЗАДАЧІ ---
app.get('/instructor/tasks', authorize(['instructor', 'moderator', 'admin']), async (req, res) => {
  const token = req.cookies.token;
  const coursesData = await makeRequest('/learning/courses', 'GET', null, token);
  const tasksData = await makeRequest('/learning/tasks', 'GET', null, token);
  
  res.render('instructor/tasks', { 
      courses: (coursesData && !coursesData.error) ? coursesData : [],
      tasks: (tasksData && !tasksData.error) ? tasksData : []
  });
});

app.post('/instructor/tasks/add', authorize(['instructor', 'admin']), async (req, res) => {
  const token = req.cookies.token;
  const payload = { 
      ...req.body, 
      isFree: req.body.isFree ? 1 : 0, // обробка чекбоксу
      isPublished: 0 
  };
  await makeRequest('/learning/tasks', 'POST', payload, token);
  res.redirect('/instructor/tasks');
});

app.post('/instructor/tasks/edit/:id', authorize(['instructor', 'admin']), async (req, res) => {
  const token = req.cookies.token;
  const payload = {
    ...req.body,
    isFree: req.body.isFree ? 1 : 0 // Перетворення чекбоксу у формат 1/0 для бази даних
  };
  await makeRequest(`/learning/tasks/${req.params.id}`, 'PUT', payload, token);
  res.redirect('/instructor/tasks');
});

// =========================================================================
// ПАНЕЛЬ МОДЕРАТОРА (Доступно тільки Модератору та Адміну)
// =========================================================================
app.get('/moderator/main', authorize(['moderator', 'admin']), async (req, res) => {
  const token = req.cookies.token;
  const dashboardData = await makeRequest('/dashboard/metrics', 'GET', null, token);
  
  res.render('moderator/main', { 
    dashboard: dashboardData.dashboard,
    metrics: dashboardData.subscriptions || {}, 
    activeSessions: dashboardData.activeSessions || 0,
    users: dashboardData.users || [] // Передаємо масив користувачів
  });
});

// Обробка форми блокування/зміни ролі модератором
app.post('/moderator/users/update/:id', authorize(['moderator', 'admin']), async (req, res) => {
  const token = req.cookies.token;
  const userId = req.params.id;
  
  // 1. Звертаємося до нашого НОВОГО бекенд-маршруту (/state)
  await makeRequest(`/admin/users/${userId}/state`, 'PUT', req.body, token);
  
  // 2. Редірект з параметром ?tab=users (щоб JS на сторінці знав, яку вкладку відкрити)
  res.redirect('/moderator/main?tab=users');
});

app.get('/moderator/subscriptions', authorize(['moderator', 'admin']), async (req, res) => {
  const token = req.cookies.token;
  const data = await makeRequest('/dashboard/subscriptions', 'GET', null, token);
  
  res.render('moderator/subscriptions', { 
    subscriptions: data.subscriptions || [],
    plans: data.plans || [],
    rules: data.rules || []
  });
});

// Проксі для дій модератора
app.post('/moderator/subscriptions/plans', authorize(['moderator', 'admin']), async (req, res) => {
  const token = req.cookies.token;
  await makeRequest('/dashboard/subscriptions/plans', 'POST', req.body, token);
  res.redirect('/moderator/subscriptions?tab=plans');
});

app.post('/moderator/subscriptions/grant', authorize(['moderator', 'admin']), async (req, res) => {
  const token = req.cookies.token;
  await makeRequest('/dashboard/subscriptions/grant', 'POST', req.body, token);
  res.redirect('/moderator/subscriptions?tab=users');
});

app.post('/moderator/subscriptions/remove/:id', authorize(['moderator', 'admin']), async (req, res) => {
  const token = req.cookies.token;
  await makeRequest(`/dashboard/subscriptions/remove/${req.params.id}`, 'DELETE', null, token);
  res.redirect('/moderator/subscriptions?tab=users');
});

app.post('/moderator/subscriptions/rules', authorize(['moderator', 'admin']), async (req, res) => {
  const token = req.cookies.token;
  await makeRequest('/dashboard/subscriptions/rules', 'POST', req.body, token);
  res.redirect('/moderator/subscriptions?tab=rules');
});

app.post('/moderator/courses/approve/:id', authorize(['moderator', 'admin']), async (req, res) => {
  const token = req.cookies.token;
  await makeRequest(`/learning/courses/approve/${req.params.id}`, 'POST', {}, token);
  res.redirect('/instructor/courses');
});

app.post('/moderator/tasks/approve/:id', authorize(['moderator', 'admin']), async (req, res) => {
  const token = req.cookies.token;
  await makeRequest(`/learning/tasks/approve/${req.params.id}`, 'POST', {}, token);
  res.redirect('/instructor/tasks');
});

app.post('/moderator/tasks/reject/:id', authorize(['moderator', 'admin']), async (req, res) => {
  const token = req.cookies.token;
  await makeRequest(`/learning/tasks/reject/${req.params.id}`, 'POST', {}, token);
  res.redirect('/instructor/tasks');
});

// =========================================================================
// АДМІНІСТРАТИВНА ПАНЕЛЬ (Строго тільки Адмін)
// =========================================================================

// 1. Головний дашборд зі статистикою
app.get('/admin/main', authorize(['admin']), async (req, res) => {
  const token = req.cookies.token;
  const metricsData = await makeRequest('/admin/metrics', 'GET', null, token);
  
  res.render('admin/main', { 
      // Тепер дані розділені на basic та detailed
      metrics: (metricsData && metricsData.basic) ? metricsData.basic : {},
      detailed: (metricsData && metricsData.detailed) ? metricsData.detailed : null
  });
});

// 2. Сторінка управління користувачами (з підтримкою фільтрів)
app.get('/admin/users', authorize(['admin']), async (req, res) => {
  const token = req.cookies.token;
  
  // Передаємо параметри пошуку/фільтрації на бекенд
  const queryString = new URLSearchParams(req.query).toString();
  const endpoint = `/admin/users${queryString ? '?' + queryString : ''}`;
  
  const usersData = await makeRequest(endpoint, 'GET', null, token);
  
  res.render('admin/users', { 
      users: (usersData && !usersData.error && Array.isArray(usersData)) ? usersData : [],
      query: req.query // Обов'язково передаємо поточні фільтри у шаблон
  });
});

// 3. Зміна статусу користувача (Активувати/Заблокувати)
app.post('/admin/users/toggle/:id', authorize(['admin']), async (req, res) => {
  const token = req.cookies.token;
  const userId = req.params.id;
  const { isActive } = req.body;
  
  // Відправляємо PATCH запит
  await makeRequest(`/admin/users/${userId}/toggle`, 'PATCH', { isActive }, token);
  res.redirect('/admin/users');
});

// 4. Реєстрація нового користувача адміністратором
app.post('/admin/users/register', authorize(['admin']), async (req, res) => {
  const token = req.cookies.token;
  await makeRequest('/admin/users', 'POST', req.body, token);
  res.redirect('/admin/users');
});

app.listen(PORT, () => console.log(`[Frontend Engine Live]: Interface accessible via http://localhost:${PORT}`));