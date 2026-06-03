<?php
namespace ITTutor\Analytics\Views;
use ITTutor\Analytics\Core\View;

class ToolsView extends View {
    protected function renderBody(array $data): void {
        echo "<h1>Лабораторна робота №3: Ізольовані інструменти Regex</h1>";
        
        $res = $data['results'] ?? [];
        $activeAction = $res['triggered_action'] ?? '';

        // 1. Утиліта перевірки Email
        echo "<div style='background:#fff; padding:20px; border-radius:6px; margin-bottom:20px; box-shadow:0 1px 3px rgba(0,0,0,0.1);'>
                <h3>📧 1. Валідація Email адреси</h3>
                <form method='POST' action='/tools/process'>
                    <input type='hidden' name='action' value='check_email'>
                    <input type='text' name='email' placeholder='student@it-tutor.com' required style='width:300px; padding:8px; margin-right:10px;'>
                    <button type='submit' style='padding:8px 15px; background:#2980b9; color:white; border:none; cursor:pointer;'>Перевірити</button>
                </form>";
        if ($activeAction === 'check_email') echo "<p style='margin-top:10px; font-weight:bold; color:#2c3e50;'>Результат: {$res['email_res']}</p>";
        echo "</div>";

        // 2. Утиліта перевірки Автономеру
        echo "<div style='background:#fff; padding:20px; border-radius:6px; margin-bottom:20px; box-shadow:0 1px 3px rgba(0,0,0,0.1);'>
                <h3>🚗 2. Перевірка автомобільного номера України</h3>
                <form method='POST' action='/tools/process'>
                    <input type='hidden' name='action' value='check_car'>
                    <input type='text' name='car' placeholder='КА1234ВВ' required style='width:300px; padding:8px; margin-right:10px;'>
                    <button type='submit' style='padding:8px 15px; background:#2980b9; color:white; border:none; cursor:pointer;'>Перевірити номер</button>
                </form>";
        if ($activeAction === 'check_car') echo "<p style='margin-top:10px; font-weight:bold; color:#2c3e50;'>Результат: {$res['car_res']}</p>";
        echo "</div>";

        // 3. Утиліта перевірки Поштового індексу
        echo "<div style='background:#fff; padding:20px; border-radius:6px; margin-bottom:20px; box-shadow:0 1px 3px rgba(0,0,0,0.1);'>
                <h3>📬 3. Перевірка поштового індексу</h3>
                <form method='POST' action='/tools/process'>
                    <input type='hidden' name='action' value='check_postal'>
                    <input type='text' name='postal' placeholder='01001' required style='width:300px; padding:8px; margin-right:10px;'>
                    <button type='submit' style='padding:8px 15px; background:#2980b9; color:white; border:none; cursor:pointer;'>Перевірити індекс</button>
                </form>";
        if ($activeAction === 'check_postal') echo "<p style='margin-top:10px; font-weight:bold; color:#2c3e50;'>Результат: {$res['postal_res']}</p>";
        echo "</div>";

        // 4. Утиліта перетворення ББ-кодів у HTML
        echo "<div style='background:#fff; padding:20px; border-radius:6px; margin-bottom:20px; box-shadow:0 1px 3px rgba(0,0,0,0.1);'>
                <h3>📝 4. Конвертація рядків логів у HTML</h3>
                <form method='POST' action='/tools/process'>
                    <input type='hidden' name='action' value='convert_html'>
                    <input type='text' name='html_text' placeholder='[b]Критична помилка[/b] [color=red]System Failure[/color]' required style='width:400px; padding:8px; margin-right:10px;'>
                    <button type='submit' style='padding:8px 15px; background:#2980b9; color:white; border:none; cursor:pointer;'>Трансформувати</button>
                </form>";
        if ($activeAction === 'convert_html') echo "<div style='margin-top:10px; padding:10px; background:#f8f9fa; border:1px solid #ddd;'><b>Виведення як HTML:</b> {$res['html_res']}</div>";
        echo "</div>";

        // 5. Утиліта Ієрархічного Сканування MP3
        echo "<div style='background:#fff; padding:20px; border-radius:6px; margin-bottom:20px; box-shadow:0 1px 3px rgba(0,0,0,0.1);'>
                <h3>🎵 5. Рекурсивний пошук аудіофайлів (.mp3) у системі</h3>
                <p style='color:#7f8c8d; font-size:13px;'>Утиліта сканує ізольовану директорію 'tracks_vault' на всіх ієрархічних рівнях вкладеності.</p>
                <form method='POST' action='/tools/process'>
                    <input type='hidden' name='action' value='scan_mp3'>
                    <button type='submit' style='padding:10px 20px; background:#27ae60; color:white; border:none; font-weight:bold; cursor:pointer;'>🚀 Запустити сканування папки</button>
                </form>";
        
        if ($activeAction === 'scan_mp3' && isset($res['mp3_res'])) {
            echo "<h4 style='margin-top:15px; color:#27ae60;'>Знайдені файли логів аудіо-відповідей:</h4>";
            echo "<ul>";
            foreach ($res['mp3_res'] as $file) {
                echo "<li style='margin-bottom:6px;'>📂 <b>Шлях:</b> <span style='color:#7f8c8d;'>{$file['path']}</span> | 🎵 <b>Назва:</b> <span style='color:#2c3e50; font-weight:bold;'>{$file['name']}</span></li>";
            }
            echo "</ul>";
        }
        echo "</div>";
    }
}