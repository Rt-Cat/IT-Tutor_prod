<?php
namespace ITTutor\Analytics\Controllers;

use ITTutor\Analytics\Views\ToolsView;
use ITTutor\Analytics\Utils\RegexHelper;

class ToolsController {
    public function index($results = null) {
        if (empty($_SESSION['admin_logged_in'])) { header("Location: /login"); exit; }
        $view = new ToolsView("Інструменти Регулярних Виразів (ЛБ 3)");
        $view->render(['results' => $results]);
    }

    public function process() {
        if (empty($_SESSION['admin_logged_in'])) exit;

        $action = $_POST['action'] ?? '';
        $results = ['triggered_action' => $action];

        // Критерій а): Кожна утиліта тригериться окремо
        switch ($action) {
            case 'check_email':
                $results['email_res'] = RegexHelper::checkEmail($_POST['email'] ?? '');
                break;
            case 'check_car':
                $results['car_res'] = RegexHelper::checkCarNumber($_POST['car'] ?? '');
                break;
            case 'check_postal':
                $results['postal_res'] = RegexHelper::checkPostalCode($_POST['postal'] ?? '');
                break;
            case 'convert_html':
                $results['html_res'] = RegexHelper::logToHtml($_POST['html_text'] ?? '');
                break;
            case 'scan_mp3':
                // Критерій б): Пошук у локальній папці на всіх рівнях ієрархії
                $results['mp3_res'] = RegexHelper::findMp3Files();
                break;
        }

        $this->index($results);
    }
}