<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Tenant;
use App\Models\User;
use App\Notifications\AdminToOwnerNotification;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Notifications\DatabaseNotification;
use Illuminate\Support\Facades\Notification;
use Inertia\Inertia;

class AdminNotificationController extends Controller
{
    /**
     * Admin notification management page.
     */
    public function index(Request $request)
    {
        $this->authorizeAdmin($request);

        // Get all owners with their tenant info for the recipient picker
        $owners = User::where('is_owner', true)
            ->where('is_active', true)
            ->with('tenant:id,name,business_name,plan')
            ->select('id', 'name', 'email', 'tenant_id')
            ->orderBy('name')
            ->get()
            ->map(function ($owner) {
                return [
                    'id' => $owner->id,
                    'name' => $owner->name,
                    'email' => $owner->email,
                    'tenant_name' => $owner->tenant?->business_name ?? $owner->tenant?->name ?? 'N/A',
                    'plan' => $owner->tenant?->plan ?? 'free',
                ];
            });

        // Sent history: admin-sent notifications (grouped by batch using created_at + sender)
        $sentHistory = DatabaseNotification::where('type', 'admin_notification')
            ->orderByDesc('created_at')
            ->take(100)
            ->get()
            ->groupBy(function ($n) {
                return $n->data['title'] . '|' . $n->created_at->format('Y-m-d H:i');
            })
            ->map(function ($group) {
                $first = $group->first();
                return [
                    'id' => $first->id,
                    'title' => $first->data['title'] ?? '',
                    'body' => $first->data['body'] ?? '',
                    'type' => $first->data['type'] ?? 'announcement',
                    'priority' => $first->data['priority'] ?? 'normal',
                    'sender_name' => $first->data['sender_name'] ?? 'Admin',
                    'recipient_count' => $group->count(),
                    'read_count' => $group->whereNotNull('read_at')->count(),
                    'created_at' => $first->created_at->toIso8601String(),
                ];
            })
            ->values()
            ->take(50);

        // Plan distribution for targeting
        $planCounts = Tenant::where('is_active', true)
            ->selectRaw("plan, COUNT(*) as count")
            ->groupBy('plan')
            ->pluck('count', 'plan')
            ->toArray();

        return Inertia::render('Admin/Notifications/Index', [
            'owners' => $owners,
            'sentHistory' => $sentHistory,
            'planCounts' => $planCounts,
        ]);
    }

    /**
     * Send notification to owners.
     */
    public function send(Request $request): JsonResponse
    {
        $this->authorizeAdmin($request);

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'body' => 'required|string|max:5000',
            'notification_type' => 'required|in:announcement,alert,task',
            'priority' => 'required|in:low,normal,high',
            'target' => 'required|in:all,specific,by_plan',
            'recipient_ids' => 'required_if:target,specific|array',
            'recipient_ids.*' => 'integer|exists:users,id',
            'plans' => 'required_if:target,by_plan|array',
            'plans.*' => 'string|in:free,starter,pro,business',
        ]);

        $sender = $request->user();

        // Determine recipients
        $recipientsQuery = User::where('is_owner', true)->where('is_active', true);

        switch ($validated['target']) {
            case 'all':
                // All active owners
                break;

            case 'specific':
                $recipientsQuery->whereIn('id', $validated['recipient_ids'] ?? []);
                break;

            case 'by_plan':
                $tenantIds = Tenant::whereIn('plan', $validated['plans'] ?? [])
                    ->where('is_active', true)
                    ->pluck('id');
                $recipientsQuery->whereIn('tenant_id', $tenantIds);
                break;
        }

        $recipients = $recipientsQuery->get();

        if ($recipients->isEmpty()) {
            return response()->json(['error' => 'No recipients found matching the criteria'], 422);
        }

        $notification = new AdminToOwnerNotification(
            title: $validated['title'],
            body: $validated['body'],
            notificationType: $validated['notification_type'],
            priority: $validated['priority'],
            senderId: $sender->id,
            senderName: $sender->name,
        );

        Notification::send($recipients, $notification);

        return response()->json([
            'success' => true,
            'message' => 'Notification sent to ' . $recipients->count() . ' owner(s)',
            'recipientCount' => $recipients->count(),
        ]);
    }

    /**
     * Get owners list filtered by plan (JSON API for dynamic filtering).
     */
    public function getOwners(Request $request): JsonResponse
    {
        $this->authorizeAdmin($request);

        $query = User::where('is_owner', true)
            ->where('is_active', true)
            ->with('tenant:id,name,business_name,plan');

        if ($request->filled('plan')) {
            $tenantIds = Tenant::where('plan', $request->plan)
                ->where('is_active', true)
                ->pluck('id');
            $query->whereIn('tenant_id', $tenantIds);
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'ilike', "%{$search}%")
                    ->orWhere('email', 'ilike', "%{$search}%");
            });
        }

        $owners = $query->select('id', 'name', 'email', 'tenant_id')
            ->orderBy('name')
            ->get()
            ->map(function ($owner) {
                return [
                    'id' => $owner->id,
                    'name' => $owner->name,
                    'email' => $owner->email,
                    'tenant_name' => $owner->tenant?->business_name ?? $owner->tenant?->name ?? 'N/A',
                    'plan' => $owner->tenant?->plan ?? 'free',
                ];
            });

        return response()->json(['owners' => $owners]);
    }

    /**
     * Authorize that the current user is a platform admin.
     */
    private function authorizeAdmin(Request $request): void
    {
        $user = $request->user();
        if (!$user || !$user->is_admin) {
            abort(403, 'Unauthorized. Admin access required.');
        }
    }
}
