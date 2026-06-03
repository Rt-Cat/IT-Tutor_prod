<?php
namespace ITTutor\Analytics\Strategies;

interface TrackingStrategyInterface {
    public function processLog(array $logData, $sqliteAdapter): void;
}