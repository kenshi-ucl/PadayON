<?php

namespace App\Console\Commands;

use App\Models\Customer;
use App\Models\Tenant;
use App\Services\SmsService;
use Illuminate\Console\Command;
use Stancl\Tenancy\Facades\Tenancy;

class SendCreditReminders extends Command
{
    protected $signature = 'padayon:send-credit-reminders {--days=7 : Days since last credit}';

    protected $description = 'Send SMS reminders to customers with outstanding credit';

    public function handle(SmsService $smsService)
    {
        $days = $this->option('days');
        $sent = 0;
        $failed = 0;

        $tenants = Tenant::where('is_active', true)->get();

        foreach ($tenants as $tenant) {
            Tenancy::initialize($tenant);

            $customers = Customer::where('current_balance', '>', 0)
                ->where('credit_enabled', true)
                ->whereNotNull('phone')
                ->whereDate('last_credit_date', '<=', now()->subDays($days))
                ->get();

            foreach ($customers as $customer) {
                try {
                    if ($smsService->canSendSms($tenant)) {
                        $sms = $smsService->sendCreditReminder($customer);
                        if ($sms && $sms->status === 'sent') {
                            $sent++;
                            $this->info("Sent reminder to {$customer->name} ({$customer->phone})");
                        }
                    }
                } catch (\Exception $e) {
                    $failed++;
                    $this->error("Failed for {$customer->name}: {$e->getMessage()}");
                }
            }

            Tenancy::end();
        }

        $this->info("Completed: {$sent} sent, {$failed} failed");
        return 0;
    }
}
