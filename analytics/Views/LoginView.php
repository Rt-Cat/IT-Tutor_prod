<?php
namespace ITTutor\Analytics\Views;
use ITTutor\Analytics\Core\View;

class LoginView extends View {
    protected function renderHeader(): void { echo "<html><body style='text-align:center; padding-top:50px; font-family:Arial;'>"; }
    protected function renderFooter(): void { echo "</body></html>"; }
    
    protected function renderBody(array $data): void {
        echo "<h2>Вхід до Панелі Аналітики</h2>";
        if (!empty($data['error'])) echo "<p style='color:red;'>{$data['error']}</p>";
        echo "<form method='POST' action='/login'>
                Логін: <input type='text' name='username' value=''><br><br>
                Пароль: <input type='password' name='password' value=''><br><br>
                <button type='submit'>Увійти</button>
              </form>";
    }
}