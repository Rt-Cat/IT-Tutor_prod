<?php
namespace ITTutor\Analytics\Strategies;

class AuthTrackingStrategy implements TrackingStrategyInterface {
    public function processLog(array $logData, $sqliteAdapter): void {
        $pdo = $sqliteAdapter->getPdo();
        // Накопичення дій для авторизованих
        $sql = "SELECT id FROM access_logs WHERE user_agent = ? AND referer = ? AND ip_address = ? AND token = ? LIMIT 1";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([$logData['user_agent'], $logData['referer'], $logData['ip_address'], $logData['token']]);
        $row = $stmt->fetch();

        if ($row) {
            $pdo->prepare("UPDATE access_logs SET count = count + 1, last_updated = ? WHERE id = ?")->execute([$logData['last_updated'], $row['id']]);
        } else {
            $sqliteAdapter->insert('access_logs', $logData);
        }
    }
}