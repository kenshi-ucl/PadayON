<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\BroadcastMessage;
use Illuminate\Notifications\Notification;

class AdminToOwnerNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        private string $title,
        private string $body,
        private string $notificationType = 'announcement',
        private string $priority = 'normal',
        private ?int $senderId = null,
        private ?string $senderName = null,
    ) {}

    public function via(object $notifiable): array
    {
        return ['database', 'broadcast'];
    }

    public function toArray(object $notifiable): array
    {
        return [
            'title' => $this->title,
            'body' => $this->body,
            'type' => $this->notificationType,
            'priority' => $this->priority,
            'sender_id' => $this->senderId,
            'sender_name' => $this->senderName ?? 'PadayON Admin',
            'source' => 'admin',
        ];
    }

    public function toBroadcast(object $notifiable): BroadcastMessage
    {
        return new BroadcastMessage([
            'title' => $this->title,
            'body' => $this->body,
            'type' => $this->notificationType,
            'priority' => $this->priority,
            'sender_name' => $this->senderName ?? 'PadayON Admin',
            'source' => 'admin',
            'created_at' => now()->toIso8601String(),
        ]);
    }

    public function databaseType(object $notifiable): string
    {
        return 'admin_notification';
    }
}
