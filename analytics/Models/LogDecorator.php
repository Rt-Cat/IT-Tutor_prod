<?php
namespace ITTutor\Analytics\Models;

class LogDecorator {
    // Декоруємо лог: Маскуємо IP-адресу для забезпечення GDPR (напр. 192.168.1.100 -> 192.168.1.***)
    public static function maskIpBeforeSave(array $data): array {
        if (isset($data['ip_address'])) {
            $data['ip_address'] = preg_replace('/\.\d+$/', '.***', $data['ip_address']);
        }
        return $data;
    }
}