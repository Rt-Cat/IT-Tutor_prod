const express = require('express');
const cookieParser = require('cookie-parser');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const API_URL = process.env.API_URL || 'http://localhost:5000/api';

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

// Перевірка наявності активної сесії для уникнення повторного логіну
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

// Гет-маршрути з прихованою навігацією та автоматичним редиректом
app.get('/', redirectIfAuthenticated, (req, res) => res.redirect('/auth/login'));

app.get('/auth/login', redirectIfAuthenticated, (req, res) => {
  res.render('auth/login', { error: null, hideNav: true });
});

app.get('/auth/register', redirectIfAuthenticated, async (req, res) => {
  // Робимо запит до нашого нового ендпоінту
  const status = await makeRequest('/auth/admin-exists', 'GET');
  const adminExists = status && status.exists ? true : false;

  res.render('auth/register', { 
    error: null, 
    hideNav: true,
    adminExists: adminExists // Передаємо статус у EJS
  });
});

// Обробка реєстрації (POST)
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

// Обробка логіну (POST) з розподілом за рольовою моделлю
app.post('/auth/login', async (req, res) => {
  const data = await makeRequest('/auth/login', 'POST', req.body);
  if (data.error || !data.token) {
    // Якщо дані невалідні, повертаємо помилку на сторінку логіну без відображення меню
    return res.render('auth/login', { error: data.error || 'Невірні дані', hideNav: true });
  }
  
  // Встановлюємо куки, якщо токен валідний
  res.cookie('token', data.token, { httpOnly: true });
  res.cookie('role', data.user.role);

  // Маршрутизація користувача відповідно до його системної ролі
  if (data.user.role === 'admin') return res.redirect('/admin/main');
  if (data.user.role === 'moderator') return res.redirect('/moderator/main');
  if (data.user.role === 'instructor') return res.redirect('/instructor/tech');
  
  // Студент за замовчуванням приземляється у Workspace
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
  // Звертаємось до бекенду за даними студента
  const data = await makeRequest('/student/dashboard', 'GET', null, token);
  
  res.render('student/dashboard', { 
    progress: data.myProgress || [], 
    scoreboard: data.scoreboard || [] 
  });
});

app.get('/student/workspace', async (req, res) => {
  res.render('student/workspace', { taskId: 'Загальна консоль валідації' });
});

app.get('/student/workspace/:taskId', async (req, res) => {
  const token = req.cookies.token;
  res.render('student/workspace', { taskId: req.params.taskId, token });
});

app.get('/student/profiles', async (req, res) => {
  const token = req.cookies.token;
  const profilesData = await makeRequest('/profiles', 'GET', null, token);
  res.render('student/profiles', { profiles: profilesData || [] });
});

// =========================================================================
// СТУДЕНТСЬКИЙ ІНТЕРФЕЙС (Доступно всім авторизованим користувачам)
// =========================================================================
app.get('/student/workspace', authorize(['student', 'instructor', 'moderator', 'admin']), async (req, res) => {
  res.render('student/workspace', { taskId: 'Загальна консоль валідації' });
});

app.get('/student/profiles', authorize(['student', 'instructor', 'moderator', 'admin']), async (req, res) => {
  const token = req.cookies.token;
  const profilesData = await makeRequest('/profiles', 'GET', null, token);
  res.render('student/profiles', { profiles: profilesData || [] });
});

// =========================================================================
// ІНТЕРФЕЙС ІНСТРУКТОРА (Доступно Інструктору, Модератору та Адміну)
// =========================================================================
app.get('/instructor/tech', authorize(['instructor', 'moderator', 'admin']), async (req, res) => {
  const token = req.cookies.token;
  
  // Робимо запит за деревом контенту
  const treeData = await makeRequest('/learning/tree', 'GET', null, token);
  
  // ВАЖЛИВО: Передаємо саме змінну "tree" у шаблон!
  // Якщо сталась помилка мережі (treeData.error), передаємо порожній масив.
  res.render('instructor/tech', { 
      tree: (treeData && !treeData.error) ? treeData : [] 
  });
});

app.get('/instructor/courses', authorize(['instructor', 'moderator', 'admin']), async (req, res) => {
  res.render('instructor/courses');
});

app.get('/instructor/tasks', authorize(['instructor', 'moderator', 'admin']), async (req, res) => {
  res.render('instructor/tasks');
});

// =========================================================================
// ПАНЕЛЬ МОДЕРАТОРА (Доступно тільки Модератору та Адміну)
// =========================================================================
app.get('/moderator/main', authorize(['moderator', 'admin']), async (req, res) => {
  const token = req.cookies.token;
  const dashboardData = await makeRequest('/dashboard/metrics', 'GET', null, token);
  res.render('moderator/main', { metrics: dashboardData.subscriptions || {}, activeSessions: dashboardData.activeSessions || 0 });
});

app.get('/moderator/subscriptions', authorize(['moderator', 'admin']), async (req, res) => {
  res.render('moderator/subscriptions');
});

// =========================================================================
// АДМІНІСТРАТИВНА ПАНЕЛЬ (Строго тільки Адмін)
// =========================================================================
app.get('/admin/main', authorize(['admin']), async (req, res) => {
  const token = req.cookies.token;
  const dashboardData = await makeRequest('/dashboard/metrics', 'GET', null, token);
  res.render('admin/main', { metrics: dashboardData.stats || {}, users: dashboardData.userManagementList || [] });
});

app.get('/admin/users', authorize(['admin']), async (req, res) => {
  res.render('admin/users');
});

app.post('/admin/users/register', authorize(['admin']), async (req, res) => {
  const token = req.cookies.token;
  // Відправляємо запит на захищений бекенд-маршрут
  await makeRequest('/dashboard/users', 'POST', req.body, token);
  res.redirect('/admin/users');
});

app.listen(PORT, () => console.log(`[Frontend Engine Live]: Interface accessible via http://localhost:${PORT}`));

