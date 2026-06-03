<?php
namespace ITTutor\Analytics\Views;
use ITTutor\Analytics\Core\View;

class DashboardView extends View {
    protected function renderBody(array $data): void {
        echo "<h1>IT-Tutor Analytics Dashboard</h1>";

        if (isset($_SESSION['admin_msg'])) {
            echo "<div style='background: #ebf5fb; border-left: 5px solid #2980b9; padding: 12px; margin-bottom: 20px; font-weight: bold;'>{$_SESSION['admin_msg']}</div>";
            unset($_SESSION['admin_msg']);
        }

        // Безпечне отримання імені користувача через Null-coalescing operator
        $currentAdminName = $_SESSION['admin_username'] ?? 'admin';

        echo "<div style='display: flex; gap: 20px; margin-bottom: 30px;'>
                <div style='flex: 1; background: #fff; padding: 20px; border-radius: 6px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);'>
                    <h3>🔒 Зміна паролю (Користувач: " . htmlspecialchars($currentAdminName) . ")</h3>
                    <form method='POST' action='/admin/password/change'>
                        <input type='password' name='old_password' placeholder='Старий пароль' required style='padding:8px; width:90%; margin-bottom:10px;'><br>
                        <input type='password' name='new_password' placeholder='Новий пароль' required style='padding:8px; width:90%; margin-bottom:10px;'><br>
                        <button type='submit' style='padding:8px 15px; background:#2980b9; color:#fff; border:none; cursor:pointer;'>Оновити пароль</button>
                    </form>
                </div>
                <div style='flex: 1; background: #fff; padding: 20px; border-radius: 6px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);'>
                    <h3>👤 Додати нового адміністратора аналітики</h3>
                    <form method='POST' action='/admin/user/add'>
                        <input type='text' name='new_username' placeholder='Логін нового користувача' required style='padding:8px; width:90%; margin-bottom:10px;'><br>
                        <input type='password' name='new_password' placeholder='Пароль' required style='padding:8px; width:90%; margin-bottom:10px;'><br>
                        <button type='submit' style='padding:8px 15px; background:#27ae60; color:#fff; border:none; cursor:pointer;'>Створити користувача</button>
                    </form>
                </div>
              </div>";

        echo "<h2>Таблиця переходів на сайт (Гостьові візити)</h2>";
        echo "<table><thead><tr><th>URL</th><th>IP Address</th><th>User Agent</th><th>Referer</th><th>К-сть (Count)</th><th>Час ост. візиту</th></tr></thead><tbody>";
        foreach ($data['visits'] as $v) {
            echo "<tr><td>" . htmlspecialchars($v['request_url']) . "</td>";
            echo "<td>" . htmlspecialchars($v['ip_address']) . "</td>";
            echo "<td><small>" . htmlspecialchars($v['user_agent']) . "</small></td>";
            echo "<td>" . htmlspecialchars($v['referer']) . "</td>";
            echo "<td><span class='badge'>" . htmlspecialchars($v['count']) . "</span></td>";
            echo "<td>" . htmlspecialchars($v['last_updated']) . "</td></tr>";
        }
        echo "</tbody></table>";

        echo "<h2>Таблиця активностей користувачів (Авторизовані)</h2>";
        echo "<table><thead><tr><th>User ID</th><th>Role</th><th>URL</th><th>IP Address</th><th>User Agent</th><th>Referer</th><th>К-сть дій (Count)</th><th>Час ост. активності</th></tr></thead><tbody>";
        foreach ($data['activities'] as $a) {
            echo "<tr><td><b>" . htmlspecialchars($a['user_id']) . "</b></td>";
            echo "<td>" . htmlspecialchars($a['role']) . "</td>";
            echo "<td>" . htmlspecialchars($a['request_url']) . "</td>";
            echo "<td>" . htmlspecialchars($a['ip_address']) . "</td>";
            echo "<td><small>" . htmlspecialchars($a['user_agent']) . "</small></td>";
            echo "<td>" . htmlspecialchars($a['referer']) . "</td>";
            echo "<td><span class='badge' style='background:#27ae60;'>" . htmlspecialchars($a['count']) . "</span></td>";
            echo "<td>" . htmlspecialchars($a['last_updated']) . "</td></tr>";
        }
        echo "</tbody></table>";
    }
}