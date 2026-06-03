<?php
namespace ITTutor\Analytics\Models;

class AccessLog {
    public $url;
    public $userAgent;
    public $referer;
    public $ip;
    public $token;
    public $userId;
    public $role;

    public function toArray(): array {
        return [
            'request_url' => $this->url,
            'user_agent' => $this->userAgent,
            'referer' => $this->referer,
            'ip_address' => $this->ip,
            'token' => $this->token,
            'user_id' => $this->userId,
            'role' => $this->role,
            'last_updated' => date('Y-m-d H:i:s')
        ];
    }
}