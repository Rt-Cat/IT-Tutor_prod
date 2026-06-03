<?php
namespace ITTutor\Analytics;

use ITTutor\Analytics\Core\Router;

// =========================================================================
// 1. Дозволяємо CORS запити від Фронтенду (Порт 3000 -> 10000)
// =========================================================================
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Якщо це перевірочний запит OPTIONS від браузера - повертаємо 200 OK і зупиняємось
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

session_start();

spl_autoload_register(function ($class) {
    $prefix = 'ITTutor\\Analytics\\';
    $base_dir = __DIR__ . '/';
    $len = strlen($prefix);
    if (strncmp($prefix, $class, $len) !== 0) return;
    $relative_class = substr($class, $len);
    $file = $base_dir . str_replace('\\', '/', $relative_class) . '.php';
    if (file_exists($file)) require $file;
});

$router = Router::getInstance();

// Маршрути інтерфейсу
$router->addRoute('GET', '/', 'AnalyticsController@index');
$router->addRoute('GET', '/login', 'AuthController@showLogin');
$router->addRoute('POST', '/login', 'AuthController@login');
$router->addRoute('GET', '/logout', 'AuthController@logout');
$router->addRoute('POST', '/admin/user/add', 'AuthController@addUser');
$router->addRoute('POST', '/admin/password/change', 'AuthController@changePassword');
$router->addRoute('GET', '/tools', 'ToolsController@index');
$router->addRoute('POST', '/tools/process', 'ToolsController@process');

// =========================================================================
// 2. Підтримка будь-яких типів трекінг-запитів
// =========================================================================
$router->addRoute('POST', '/', 'AnalyticsController@track');
$router->addRoute('POST', '/track', 'AnalyticsController@track');
$router->addRoute('GET', '/track', 'AnalyticsController@track'); // Для пікселів

$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

if (isset($_GET['track'])) {
    $router->dispatch($_SERVER['REQUEST_METHOD'], '/track');
} else {
    $router->dispatch($_SERVER['REQUEST_METHOD'], $path);
}