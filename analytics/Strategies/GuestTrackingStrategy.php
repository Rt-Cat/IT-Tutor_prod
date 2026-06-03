<?php
namespace ITTutor\Analytics\Strategies;
use PDO;

class GuestTrackingStrategy implements TrackingStrategyInterface {
    public function processLog(array $logData, $sqliteAdapter): void {
        $pdo = $sqliteAdapter->getPdo();
        // Часове вікно 1 хвилина для гостей
        $sql = "SELECT id FROM access_logs WHERE user_agent = ? AND referer = ? AND ip_address = ? AND token = 'no' AND last_updated >= datetime('now', '-1 minute') LIMIT 1";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([$logData['user_agent'], $logData['referer'], $logData['ip_address']]);
        $row = $stmt->fetch();

        if ($row) {
            $pdo->prepare("UPDATE access_logs SET count = count + 1, last_updated = ? WHERE id = ?")->execute([$logData['last_updated'], $row['id']]);
        } else {
            $sqliteAdapter->insert('access_logs', $logData);
        }
    }
}