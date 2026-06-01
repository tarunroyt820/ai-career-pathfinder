/**
 * NotificationPanel Component
 * Dropdown panel showing notifications with pagination and actions
 */

import {
  useGetNotifications,
  useMarkAllNotificationsRead,
} from '@/hooks/useNotifications';
import {
  deleteNotification,
  markNotificationRead,
} from '@/services/notificationsApi';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/common/Button';
import {
  AlertCircle,
  CheckCircle2,
  Lightbulb,
  Zap,
  X,
  MessageSquare,
  Loader2,
  ChevronDown,
} from 'lucide-react';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { Notification } from '@/services/notificationsApi';

interface NotificationPanelProps {
  onClose?: () => void;
}

export default function NotificationPanel({ onClose }: NotificationPanelProps) {
  const { data, hasNextPage, fetchNextPage, isLoading } =
    useGetNotifications();
  const markAllReadMutation = useMarkAllNotificationsRead();
  const queryClient = useQueryClient();

  const notifications = data?.pages.flatMap((page) => page.notifications) || [];
  const unreadCount =
    data?.pages[0]?.unreadCount ||
    notifications.filter((n) => !n.read).length;

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await markNotificationRead(notificationId);
      await queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast.success('Marked as read');
    } catch (err) {
      toast.error('Failed to mark as read');
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllReadMutation.mutateAsync();
      toast.success('All marked as read');
    } catch (err) {
      toast.error('Failed to mark all as read');
    }
  };

  const handleDelete = async (notificationId: string) => {
    try {
      await deleteNotification(notificationId);
      await queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast.success('Notification deleted');
    } catch (err) {
      toast.error('Failed to delete notification');
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'milestone_due_soon':
      case 'milestone_overdue':
        return <AlertCircle className="h-4 w-4 text-orange-500" />;
      case 'plan_ai_ready':
      case 'recommendation_generated':
        return <Lightbulb className="h-4 w-4 text-blue-500" />;
      case 'session_reminder':
        return <Zap className="h-4 w-4 text-yellow-500" />;
      default:
        return <MessageSquare className="h-4 w-4 text-gray-500" />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'milestone_overdue':
        return 'border-l-4 border-red-500 bg-red-500/5';
      case 'milestone_due_soon':
        return 'border-l-4 border-orange-500 bg-orange-500/5';
      case 'plan_ai_ready':
      case 'recommendation_generated':
        return 'border-l-4 border-blue-500 bg-blue-500/5';
      default:
        return 'border-l-4 border-gray-300 bg-gray-50 dark:bg-gray-900/30';
    }
  };

  return (
    <Card className="w-96 max-h-[600px] rounded-2xl border-border shadow-lg flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border/50">
        <div>
          <h3 className="font-semibold">Notifications</h3>
          {unreadCount > 0 && (
            <p className="text-xs text-muted-foreground">
              {unreadCount} unread
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <Button
              size="sm"
              variant="outline"
              onClick={handleMarkAllAsRead}
              disabled={markAllReadMutation.isPending}
              className="text-xs"
            >
              Mark all read
            </Button>
          )}
          <Button
            size="icon"
            variant="ghost"
            onClick={onClose}
            className="h-6 w-6"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Notifications List */}
      <div className="overflow-y-auto flex-1">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <CheckCircle2 className="h-8 w-8 text-green-500 mb-2" />
            <p className="text-sm font-medium">All caught up!</p>
            <p className="text-xs text-muted-foreground">
              No new notifications
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border/30">
            {notifications.map((notification: Notification) => (
              <div
                key={notification._id}
                className={`p-3 hover:bg-accent/50 transition-colors cursor-pointer group ${getNotificationColor(
                  notification.type
                )}`}
              >
                <div className="flex items-start gap-3">
                  {/* Icon */}
                  <div className="flex-shrink-0 mt-1">
                    {getNotificationIcon(notification.type)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium line-clamp-2">
                      {notification.message}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(notification.createdAt).toLocaleDateString(
                        'en-US',
                        {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        }
                      )}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex-shrink-0 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {!notification.read && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() =>
                          handleMarkAsRead(notification._id)
                        }
                        className="h-6 w-6 p-0"
                        title="Mark as read"
                      >
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDelete(notification._id)}
                      className="h-6 w-6 p-0"
                      title="Delete"
                    >
                      <X className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Load More */}
      {hasNextPage && (
        <div className="p-3 border-t border-border/50">
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={() => fetchNextPage()}
          >
            <ChevronDown className="h-4 w-4 mr-2" />
            Load more
          </Button>
        </div>
      )}
    </Card>
  );
}
