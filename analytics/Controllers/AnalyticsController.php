<?php
namespace ITTutor\Analytics\Controllers;

use ITTutor\Analytics\Core\Database\SqliteAdapter;
use ITTutor\Analytics\Models\ModelFactory;
use ITTutor\Analytics\Models\LogDecorator;
use ITTutor\Analytics\Strategies\GuestTrackingStrategy;
use ITTutor\Analytics\Strategies\AuthTrackingStrategy;
use ITTutor\Analytics\Views\DashboardView;

class AnalyticsController {
    public function index() {
        if (empty($_SESSION['admin_logged_in'])) {
            header("Location: /login");
            exit;
        }

        $sqlite = new SqliteAdapter();
        $visits = $sqlite->find('access_logs', ['custom_query' => "WHERE token = 'no' ORDER BY last_updated DESC LIMIT 50"]);
        $activities = $sqlite->find('access_logs', ['custom_query' => "WHERE token != 'no' ORDER BY count DESC LIMIT 50"]);

        $view = new DashboardView("IT-Tutor Analytics Dashboard");
        $view->render(['visits' => $visits, 'activities' => $activities]);
    }

    public function track() {
        $json = file_get_contents('php://input');
        $data = json_decode($json, true) ?? [];

        if (empty($postData) && isset($_GET['url'])) {
            $postData = $_GET;
        }

        // Factory
        $logObj = ModelFactory::createLog($data, $_SERVER, $_COOKIE);
        $logData = $logObj->toArray();
        
        // Decorator
        $logData = LogDecorator::maskIpBeforeSave($logData);

        // Strategy
        $sqlite = new SqliteAdapter();
        if ($logData['token'] === 'no') {
            $strategy = new GuestTrackingStrategy();
        } else {
            $strategy = new AuthTrackingStrategy();
        }
        
        $strategy->processLog($logData, $sqlite);

        header('Content-Type: application/json');
        echo json_encode(['status' => 'success']);
        exit;
    }
}