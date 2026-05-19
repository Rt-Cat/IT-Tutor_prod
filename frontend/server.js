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
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  
  const config = { method, headers };
  if (body) config.body = JSON.stringify(body);

  const res = await fetch(`${API_URL}${endpoint}`, config);
  return await res.json();
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

app.get('/auth/register', redirectIfAuthenticated, (req, res) => {
  res.render('auth/register', { error: null, hideNav: true });
});

// Обробка реєстрації (POST)
app.post('/auth/register', async (req, res) => {
  const data = await makeRequest('/auth/register', 'POST', req.body);
  if (data.error) {
    // Якщо виникла помилка, перерендерюємо сторінку з повідомленням і ховаємо nav bar
    return res.render('auth/register', { error: data.error, hideNav: true });
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
app.get('/student/dashboard', async (req, res) => {
  const token = req.cookies.token;
  const courses = await makeRequest('/learning/courses', 'GET', null, token);
  res.render('student/dashboard', { user: req.cookies.role, courses });
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
// АДМІНІСТРАТИВНА ПАНЕЛЬ (ADMIN)
// =========================================================================
app.get('/admin/main', async (req, res) => {
  const token = req.cookies.token;
  const dashboardData = await makeRequest('/dashboard/metrics', 'GET', null, token);
  res.render('admin/main', { metrics: dashboardData.stats || {}, users: dashboardData.userManagementList || [] });
});

//=========================================================================
// ІНСТРУКТОР: Технології 
//=========================================================================
app.get('/instructor/tech', async (req, res) => {
  const token = req.cookies.token;
  const techData = await makeRequest('/learning/technologies', 'GET', null, token);
  res.render('instructor/tech', { technologies: techData || [] });
});

app.get('/instructor/courses', async (req, res) => {
  const token = req.cookies.token;
  // Тут ви можете зробити запит до бекенду: makeRequest('/learning/tasks', 'GET', null, token)
  res.render('instructor/courses', { tasks: [] }); 
});

app.get('/instructor/tasks', async (req, res) => {
  const token = req.cookies.token;
  // Тут ви можете зробити запит до бекенду: makeRequest('/learning/tasks', 'GET', null, token)
  res.render('instructor/tasks', { tasks: [] }); 
});

//=========================================================================
// МОДЕРАТОР: Головна аналітична панель та Апрув змін
//=========================================================================
app.get('/moderator/main', async (req, res) => {
  const token = req.cookies.token;
  const dashboardData = await makeRequest('/dashboard/metrics', 'GET', null, token);
  res.render('moderator/main', { metrics: dashboardData.subscriptions || {}, activeSessions: dashboardData.activeSessions || 0 });
});

app.listen(PORT, () => console.log(`[Frontend Engine Live]: Interface accessible via http://localhost:${PORT}`));