<?php
namespace ITTutor\Analytics\Controllers;

use ITTutor\Analytics\Views\LoginView;
use ITTutor\Analytics\Core\Database\MongoAdapter;

class AuthController {
    public function showLogin(string $error = null) {
        $view = new LoginView("Авторизація Аналітики");
        $view->render(['error' => $error]);
    }

    public function login() {
        $username = $_POST['username'] ?? '';
        $password = $_POST['password'] ?? '';

        $mongo = new MongoAdapter();
        $users = $mongo->find('users', ['username' => $username]);

        if (!empty($users) && password_verify($password, $users[0]->password)) {
            $_SESSION['admin_logged_in'] = true;
            $_SESSION['admin_username'] = $username;
            header("Location: /");
        } else {
            $this->showLogin("Невірний логін або пароль!");
        }
    }

    // Функціонал додавання нового користувача аналітики в MongoDB
    public function addUser() {
        if (empty($_SESSION['admin_logged_in'])) { header("Location: /login"); exit; }
        
        $newUsername = trim($_POST['new_username'] ?? '');
        $newPassword = $_POST['new_password'] ?? '';

        if (empty($newUsername) || empty($newPassword)) {
            $_SESSION['admin_msg'] = "❌ Логін та пароль не можуть бути порожніми!";
            header("Location: /"); exit;
        }

        $mongo = new MongoAdapter();
        $exists = $mongo->find('users', ['username' => $newUsername]);

        if (!empty($exists)) {
            $_SESSION['admin_msg'] = "❌ Користувач з таким логіном вже існує!";
        } else {
            $mongo->insert('users', [
                'username' => $newUsername,
                'password' => password_hash($newPassword, PASSWORD_DEFAULT)
            ]);
            $_SESSION['admin_msg'] = "✅ Користувача '{$newUsername}' успішно додано!";
        }
        header("Location: /");
    }

    // Функціонал зміни паролю поточного користувача в MongoDB
    public function changePassword() {
        if (empty($_SESSION['admin_logged_in'])) { header("Location: /login"); exit; }
        
        $currentAdmin = $_SESSION['admin_username'] ?? 'admin';
        
        $oldPassword = $_POST['old_password'] ?? '';
        $newPassword = $_POST['new_password'] ?? '';

        $mongo = new MongoAdapter();
        $users = $mongo->find('users', ['username' => $currentAdmin]);

        if (!empty($users) && password_verify($oldPassword, $users[0]->password)) {
            $mongo->update('users', 
                ['username' => $currentAdmin], 
                ['password' => password_hash($newPassword, PASSWORD_DEFAULT)]
            );
            $_SESSION['admin_msg'] = "✅ Пароль успішно змінено!";
        } else {
            $_SESSION['admin_msg'] = "❌ Невірний старий пароль!";
        }
        header("Location: /");
    }

    public function logout() {
        session_destroy();
        header("Location: /login");
    }
}