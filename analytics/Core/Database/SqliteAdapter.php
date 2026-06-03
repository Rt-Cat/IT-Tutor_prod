<?php
namespace ITTutor\Analytics\Core\Database;

use PDO;
use PDOException;
use Exception;

// ЛБ2: Створення власних винятків
class DatabaseException extends Exception {}

class SqliteAdapter implements StorageAdapterInterface {
    private $pdo;

    public function __construct() {
        $this->connect();
        $this->initSchema();
    }

    public function connect(): void {
        try {
            // ЛБ3: З'єднання через PDO
            $this->pdo = new PDO('sqlite:' . __DIR__ . '/../../counter.sqlite');
            $this->pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        } catch (PDOException $e) {
            // ЛБ3: Використання errorCode та errorInfo
            echo "Код помилки: " . $e->errorCode() . "<br>";
            print_r($e->errorInfo());
            throw new DatabaseException("Помилка підключення до SQLite");
        }
    }

    private function initSchema(): void {
        try {
            // ЛБ3: Транзакція під час створення таблиць
            $this->pdo->beginTransaction();
            
            $sql = "CREATE TABLE IF NOT EXISTS access_logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                request_url TEXT, user_agent TEXT, referer TEXT,
                ip_address TEXT, token TEXT, user_id TEXT, role TEXT, count INTEGER DEFAULT 1,
                last_updated DATETIME
            )";
            $this->pdo->exec($sql);
            
            $this->pdo->commit();
        } catch (PDOException $e) {
            $this->pdo->rollBack();
            echo "<h3>Помилка створення БД: Неможливо ініціалізувати таблиці.</h3>";
            exit;
        }
    }

    // ЛБ3: Підготовлені запити для повторюваних вставок
    public function insert(string $table, array $data): bool {
        $columns = implode(', ', array_keys($data));
        $placeholders = ':' . implode(', :', array_keys($data));
        $sql = "INSERT INTO $table ($columns) VALUES ($placeholders)";
        $stmt = $this->pdo->prepare($sql);

        $execData = [];
        foreach ($data as $key => $value) {
            $execData[':' . $key] = $value;
        }

        return $stmt->execute($execData);
    }

    public function find(string $table, array $conditions = []): array {
        // Спрощена реалізація вибірки для логів
        $sql = "SELECT * FROM $table";
        if (isset($conditions['custom_query'])) {
            $sql .= " " . $conditions['custom_query'];
        } else {
            $sql .= " ORDER BY last_updated DESC LIMIT 100";
        }
        $stmt = $this->pdo->query($sql);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
    
    // ЛБ2: Метод видалення
    public function delete(string $table, int $id): bool {
        $stmt = $this->pdo->prepare("DELETE FROM $table WHERE id = :id");
        return $stmt->execute([':id' => $id]);
    }
    
    public function getPdo(): PDO {
        return $this->pdo;
    }
}