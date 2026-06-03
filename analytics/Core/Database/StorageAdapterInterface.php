<?php
namespace ITTutor\Analytics\Core\Database;

// ЛБ5: Шаблон Adapter
interface StorageAdapterInterface {
    public function connect(): void;
    public function insert(string $table, array $data): bool;
    public function find(string $table, array $conditions): array;
}