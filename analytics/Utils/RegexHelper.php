<?php
namespace ITTutor\Analytics\Utils;

class RegexHelper {
    public static function logToHtml(string $text): string {
        $text = preg_replace('/\[b\](.*?)\[\/b\]/i', '<strong>$1</strong>', $text);
        return preg_replace('/\[color=(.*?)\](.*?)\[\/color\]/i', '<span style="color:$1;">$2</span>', $text);
    }

    public static function checkEmail(string $email): string {
        if (preg_match('/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/', $email)) return "✅ Email валідний";
        return "❌ Невірний формат";
    }

    public static function checkCarNumber(string $number): string {
        if (preg_match('/^([A-ZА-Я]{2})\d{4}[A-ZА-Я]{2}$/u', $number, $matches)) {
            $regions = ['АА' => 'Київ', 'КА' => 'Київ', 'ВС' => 'Львівська обл.'];
            return isset($regions[$matches[1]]) ? "✅ Область: " . $regions[$matches[1]] : '✅ Номер дійсний (Інша область)';
        }
        return "❌ Некоректний автономер";
    }

    public static function checkPostalCode(string $code): string {
        if (preg_match('/^(0[1-9]|[1-9]\d)\d{3}$/', $code)) {
            $prefix = substr($code, 0, 2);
            if ($prefix === '01' || $prefix === '02') return "✅ Регіон: Київ";
            if ($prefix === '79') return "✅ Регіон: Львівська область";
            return "✅ Інша область України";
        }
        return "❌ Невірний індекс";
    }

    //Переносимо локальну папку в /tmp для обходу обмежень Docker Permissions
    public static function findMp3Files(): array {
        $targetDir = '/tmp/analytics_tracks_vault';
        
        // Автоматична генерація 12-15 файлів на різних рівнях ієрархії
        if (!is_dir($targetDir)) {
            mkdir($targetDir, 0777, true);
            mkdir($targetDir . '/nested_level_1', 0777, true);
            mkdir($targetDir . '/nested_level_1/nested_level_2', 0777, true);
            
            // Кореневий рівень
            file_put_contents($targetDir . '/intro_lecture.mp3', 'mock_data');
            file_put_contents($targetDir . '/syllabus.pdf', 'mock_data');
            file_put_contents($targetDir . '/notes.txt', 'mock_data');
            
            // Рівень 1
            file_put_contents($targetDir . '/nested_level_1/lab_explanation.MP3', 'mock_data');
            file_put_contents($targetDir . '/nested_level_1/diagram.png', 'mock_data');
            file_put_contents($targetDir . '/nested_level_1/podcast_01.mp3', 'mock_data');
            file_put_contents($targetDir . '/nested_level_1/archive.zip', 'mock_data');
            
            // Рівень 2 (глибока вкладеність)
            file_put_contents($targetDir . '/nested_level_1/nested_level_2/ai_mentor_voice.mp3', 'mock_data');
            file_put_contents($targetDir . '/nested_level_1/nested_level_2/config.json', 'mock_data');
            file_put_contents($targetDir . '/nested_level_1/nested_level_2/final_summary.mp3', 'mock_data');
            file_put_contents($targetDir . '/nested_level_1/nested_level_2/background_track.wav', 'mock_data');
        }

        $mp3Files = [];
        $directoryIterator = new \RecursiveDirectoryIterator($targetDir, \RecursiveDirectoryIterator::SKIP_DOTS);
        $iterator = new \RecursiveIteratorIterator($directoryIterator);

        foreach ($iterator as $file) {
            if (preg_match('/\.mp3$/i', $file->getFilename())) {
                $mp3Files[] = [
                    'path' => $file->getPathname(),
                    'name' => $file->getFilename()
                ];
            }
        }

        return $mp3Files;
    }
}