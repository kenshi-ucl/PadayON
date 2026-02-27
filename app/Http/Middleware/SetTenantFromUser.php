<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class SetTenantFromUser
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = auth()->user();

        if ($user && $user->tenant_id) {
            $tenant = \App\Models\Tenant::find($user->tenant_id);

            if ($tenant) {
                // Set tenant in container so tenant() helper works
                app()->instance('currentTenant', $tenant);

                // Also set for stancl/tenancy if available
                if (function_exists('tenancy')) {
                    try {
                        tenancy()->initialize($tenant);
                    } catch (\Exception $e) {
                        // Tenancy may not be fully initialized in local dev
                    }
                }
            }
        }

        return $next($request);
    }
}
