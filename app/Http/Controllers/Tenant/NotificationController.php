<?php

namespace App\Http\Controllers\Tenant;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Notifications\OwnerToStaffNotification;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Notifications\DatabaseNotification;
use Illuminate\Support\Facades\Notification;
use Inertia\Inertia;

class NotificationController extends Controller
{
    /**
     * Full notifications page.
     */
    public function index(Request $request)
    {
        $user = $request->user();

        $query = $user->notifications();

        if ($request->filled('type') && $request->type !== 'all') {
            $query->where('notification_type', $request->type);
        }

        if ($request->filled('status')) {
            if ($request->status === 'unread') {
                $query->whereNull('read_at');
            } elseif ($request->status === 'read') {
                $query->whereNotNull('read_at');
            }
        }

        $notifications = $query->orderByDesc('created_at')->paginate(20);

        return Inertia::render('Notifications/Index', [
            'notifications' => $notifications,
            'filters' => [
                'type' => $request->get('type', 'all'),
                'status' => $request->get('status', 'all'),
            ],
            'isOwner' => $user->is_owner,
        ]);
    }

    /**
     * JSON API: paginated notifications for the user.
     */
    public function getNotifications(Request $request): JsonResponse
    {
        $user = $request->user();
        $notifications = $user->notifications()
            ->orderByDesc('created_at')
            ->take(20)
            ->get();

        return response()->json([
            'notifications' => $notifications,
        ]);
    }

    /**
     * JSON API: unread notification count.
     */
    public function unreadCount(Request $request): JsonResponse
    {
        return response()->json([
            'count' => $request->user()->unreadNotifications()->count(),
        ]);
    }

    /**
     * Mark a single notification as read.
     */
    public function markAsRead(Request $request, string $notification): JsonResponse
    {
        $notif = $request->user()->notifications()->where('id', $notification)->first();

        if (!$notif) {
            return response()->json(['error' => 'Notification not found'], 404);
        }

        $notif->markAsRead();

        return response()->json([
            'success' => true,
            'unreadCount' => $request->user()->unreadNotifications()->count(),
        ]);
    }

    /**
     * Mark all notifications as read.
     */
    public function markAllAsRead(Request $request): JsonResponse
    {
        $request->user()->unreadNotifications->markAsRead();

        return response()->json([
            'success' => true,
            'unreadCount' => 0,
        ]);
    }

    /**
     * Owner sends notification to their team staff.
     */
    public function sendToTeam(Request $request): JsonResponse
    {
        $user = $request->user();

        if (!$user->is_owner) {
            return response()->json(['error' => 'Only owners can send team notifications'], 403);
        }

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'body' => 'required|string|max:2000',
            'notification_type' => 'required|in:announcement,alert,task',
            'recipient_ids' => 'required|array|min:1',
            'recipient_ids.*' => 'integer|exists:users,id',
        ]);

        $tenantId = $user->tenant_id;

        // Ensure all recipients belong to the same tenant and are staff
        $recipients = User::where('tenant_id', $tenantId)
            ->where('is_admin', false)
            ->whereIn('id', $validated['recipient_ids'])
            ->where('id', '!=', $user->id)
            ->where('is_active', true)
            ->get();

        if ($recipients->isEmpty()) {
            return response()->json(['error' => 'No valid recipients found'], 422);
        }

        $notification = new OwnerToStaffNotification(
            title: $validated['title'],
            body: $validated['body'],
            notificationType: $validated['notification_type'],
            priority: 'normal',
            senderId: $user->id,
            senderName: $user->name,
            tenantId: $tenantId,
        );

        Notification::send($recipients, $notification);

        return response()->json([
            'success' => true,
            'message' => 'Notification sent to ' . $recipients->count() . ' team member(s)',
            'recipientCount' => $recipients->count(),
        ]);
    }

    /**
     * Get team members for the owner's tenant.
     */
    public function getTeamMembers(Request $request): JsonResponse
    {
        $user = $request->user();

        if (!$user->is_owner) {
            return response()->json(['error' => 'Only owners can view team members'], 403);
        }

        $members = User::where('tenant_id', $user->tenant_id)
            ->where('id', '!=', $user->id)
            ->where('is_admin', false)
            ->where('is_active', true)
            ->select('id', 'name', 'email', 'is_owner', 'avatar')
            ->orderBy('name')
            ->get();

        return response()->json([
            'members' => $members,
        ]);
    }

    /**
     * Delete a notification.
     */
    public function destroy(Request $request, string $notification): JsonResponse
    {
        $notif = $request->user()->notifications()->where('id', $notification)->first();

        if (!$notif) {
            return response()->json(['error' => 'Notification not found'], 404);
        }

        $notif->delete();

        return response()->json([
            'success' => true,
            'unreadCount' => $request->user()->unreadNotifications()->count(),
        ]);
    }
}
