<?php
namespace ITTutor\Analytics\Core\Database;

use MongoDB\Driver\Manager;
use MongoDB\Driver\Query;
use MongoDB\Driver\BulkWrite;

class MongoAdapter implements StorageAdapterInterface {
    private $manager;
    private $dbName = 'analytics_admin';

    public function __construct() {
        $this->connect();
        $this->initDefaultAdmin();
    }

    public function connect(): void {
        // З'єднання з MongoDB контейнером через нативний драйвер
        $this->manager = new Manager("mongodb://analytics_mongo:27017");
    }

    public function insert(string $table, array $data): bool {
        $bulk = new BulkWrite();
        $bulk->insert($data);
        $result = $this->manager->executeBulkWrite("$this->dbName.$table", $bulk);
        return $result->getInsertedCount() > 0;
    }

    // Метод оновлення даних для зміни паролю
    public function update(string $table, array $filter, array $newData): bool {
        $bulk = new BulkWrite();
        $bulk->update($filter, ['$set' => $newData]);
        $result = $this->manager->executeBulkWrite("$this->dbName.$table", $bulk);
        return $result->getModifiedCount() > 0;
    }

    public function find(string $table, array $conditions = []): array {
        $query = new Query($conditions);
        $cursor = $this->manager->executeQuery("$this->dbName.$table", $query);
        return $cursor->toArray();
    }

    // Автоматичне створення адміна admin:admin, якщо база пуста
    private function initDefaultAdmin(): void {
        $admins = $this->find('users', ['username' => 'admin']);
        if (empty($admins)) {
            $this->insert('users', [
                'username' => 'admin',
                'password' => password_hash('admin', PASSWORD_DEFAULT)
            ]);
        }
    }
}