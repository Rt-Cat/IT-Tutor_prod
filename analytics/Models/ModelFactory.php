<?php
namespace ITTutor\Analytics\Models;

class ModelFactory {
    public static function createLog(array $data): AccessLog {
        $log = new AccessLog();
        $log->url = $data['url'] ?? '/';
        $log->userAgent = $data['user_agent'] ?? 'Unknown';
        $log->referer = $data['referer'] ?? 'Direct';
        $log->ip = $data['ip'] ?? '127.0.0.1';
        $log->token = $data['token'] ?? 'no';
        $log->userId = $data['userId'] ?? 'no';
        $log->role = $data['role'] ?? 'no';
        return $log;
    }
}