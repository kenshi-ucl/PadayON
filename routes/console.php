<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

/*
|--------------------------------------------------------------------------
| Console Routes
|--------------------------------------------------------------------------
*/

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Daily reports generation
Schedule::command('padayon:generate-daily-reports')
    ->dailyAt('01:00')
    ->description('Generate daily reports for all tenants');

// Send credit reminders
Schedule::command('padayon:send-credit-reminders')
    ->dailyAt('09:00')
    ->description('Send SMS reminders for overdue credit');

// Clean old SMS messages
Schedule::command('padayon:cleanup-sms-logs')
    ->weekly()
    ->description('Clean SMS logs older than 90 days');

// Expire trial accounts
Schedule::command('padayon:expire-trials')
    ->daily()
    ->description('Handle expired trial accounts');

// Backup database
Schedule::command('backup:run --only-db')
    ->dailyAt('02:00')
    ->description('Backup database');
