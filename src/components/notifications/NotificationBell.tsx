/**
 * NotificationBell Component
 * Badge showing unread notification count with dropdown
 */

import { Bell } from 'lucide-react';
import { useGetUnreadCount } from '@/hooks/useNotifications';
import { useState } from 'react';
import NotificationPanel from './NotificationPanel';
import { Button } from '@/components/common/Button';

export default function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const { data, isLoading: _isLoading } = useGetUnreadCount();

  const unreadCount = data || 0;

  return (
    <div className="relative">
      {/* Bell Button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsOpen(!isOpen)}
        className="relative"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 h-4 w-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-semibold">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </Button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 top-12 z-50">
          <NotificationPanel onClose={() => setIsOpen(false)} />
        </div>
      )}
    </div>
  );
}
