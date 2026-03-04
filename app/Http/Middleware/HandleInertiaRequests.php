<?php

namespace App\Http\Middleware;

use Illuminate\Http\Request;
use Inertia\Middleware;
use Tighten\Ziggy\Ziggy;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that is loaded on the first page visit.
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determine the current asset version.
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        return [
            ...parent::share($request),
            'auth' => [
                'user' => $request->user(),
                'unreadNotificationCount' => $request->user()?->unreadNotifications()->count() ?? 0,
            ],
            'tenant' => function () {
                if (function_exists('tenant') && tenant()) {
                    return tenant()->only([
                        'id',
                        'name',
                        'slug',
                        'business_type',
                        'plan',
                        'business_name',
                        'logo',
                        'gcash_enabled',
                        'maya_enabled',
                        'card_enabled',
                        'cod_enabled',
                        'trial_ends_at',
                        'subscription_ends_at',
                    ]);
                }
                return null;
            },
            'flash' => [
                'success' => fn () => $request->session()->get('success'),
                'error' => fn () => $request->session()->get('error'),
                'status' => fn () => $request->session()->get('status'),
            ],
            'ziggy' => fn () => [
                ...(new Ziggy)->toArray(),
                'location' => $request->url(),
            ],
        ];
    }
}
