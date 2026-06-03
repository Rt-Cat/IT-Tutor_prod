<?php
namespace ITTutor\Analytics\Core;

// ЛБ5: Патерн Singleton
class Router {
    private static $instance = null;
    private $routes = [];

    private function __construct() {}
    private function __clone() {}

    public static function getInstance(): self {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    public function addRoute(string $method, string $path, string $handler): void {
        $this->routes[$method][$path] = $handler;
    }

    public function dispatch(string $method, string $path): void {
        if (isset($this->routes[$method][$path])) {
            list($controllerName, $action) = explode('@', $this->routes[$method][$path]);
            $controllerClass = "ITTutor\\Analytics\\Controllers\\" . $controllerName;
            $controller = new $controllerClass();
            $controller->$action();
        } else {
            http_response_code(404);
            echo "<h1>404 Not Found</h1>";
        }
    }
}