<?php
namespace ITTutor\Analytics\Core;

abstract class View {
    protected $title;
    public function __construct(string $title) { $this->title = $title; }
    
    protected function renderHeader(): void {
        echo "<!DOCTYPE html><html><head><title>{$this->title}</title><style>body{font-family:Arial; padding:20px;} table{width:100%;border-collapse:collapse;} th,td{border:1px solid #ddd;padding:8px;} header{background:#2c3e50;color:white;padding:10px;} a{color:white;text-decoration:none;margin-right:15px;}</style></head><body>";
        echo "<header><h2>{$this->title}</h2><nav><a href='/'>📊 Дашборд</a><a href='/tools'>🛠 Інструменти Regex</a><a href='/logout'>🚪 Вихід</a></nav></header>";
    }
    
    abstract protected function renderBody(array $data): void;
    
    protected function renderFooter(): void {
        echo "<hr><footer style='text-align:center;'><small>&copy; 2026 IT-Tutor Microservice</small></footer></body></html>";
    }
    
    public function render(array $data = []): void {
        $this->renderHeader();
        $this->renderBody($data);
        $this->renderFooter();
    }
}