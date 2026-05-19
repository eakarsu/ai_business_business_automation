'use client';

import { useEffect, useState, useCallback } from 'react';
import { PageHeader } from '@/components/layout';
import { Button, useToast } from '@/components/ui';
import { Pagination } from '@/components/ui/Pagination';
import { API_URL } from '@/lib/api';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  priority: string;
  isRead: boolean;
  createdAt: string;
  readAt: string | null;
}

const priorityColors: Record<string, string> = {
  CRITICAL: 'bg-red-100 text-red-800 border-red-200',
  HIGH: 'bg-orange-100 text-orange-800 border-orange-200',
  MEDIUM: 'bg-blue-100 text-blue-800 border-blue-200',
  LOW: 'bg-gray-100 text-gray-700 border-gray-200',
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [unreadOnly, setUnreadOnly] = useState(false);
  const { showToast } = useToast();

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams({ page: String(page), limit: String(limit) });
      if (unreadOnly) params.set('unreadOnly', 'true');

      const res = await fetch(`${API_URL}/api/notifications?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
        setTotal(data.total || 0);
        setTotalPages(data.totalPages || 1);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [page, limit, unreadOnly]);

  useEffect(() => { fetchNotifications(); }, [fetchNotifications]);

  const markRead = async (id: string) => {
    try {
      const token = localStorage.getItem('token');
      await fetch(`${API_URL}/api/notifications/${id}/read`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (e) { console.error(e); }
  };

  const markAllRead = async () => {
    try {
      const token = localStorage.getItem('token');
      await fetch(`${API_URL}/api/notifications/read-all`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
      showToast('All notifications marked as read', 'success');
    } catch (e) { console.error(e); }
  };

  const deleteNotification = async (id: string) => {
    try {
      const token = localStorage.getItem('token');
      await fetch(`${API_URL}/api/notifications/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications(prev => prev.filter(n => n.id !== id));
      setTotal(prev => prev - 1);
      showToast('Notification deleted', 'success');
    } catch (e) { console.error(e); }
  };

  return (
    <>
      <PageHeader
        title="Notifications"
        subtitle={`${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}`}
        actions={
          <div className="flex gap-2">
            <Button
              variant={unreadOnly ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => { setUnreadOnly(!unreadOnly); setPage(1); }}
            >
              {unreadOnly ? 'Show All' : 'Unread Only'}
            </Button>
            {unreadCount > 0 && (
              <Button variant="ghost" size="sm" onClick={markAllRead}>
                Mark All Read
              </Button>
            )}
          </div>
        }
      />

      <div className="p-6">
        <div className="bg-white rounded-lg border border-gray-200">
          {loading ? (
            <div className="p-8 text-center text-gray-500">Loading notifications...</div>
          ) : notifications.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              {unreadOnly ? 'No unread notifications.' : 'No notifications yet.'}
            </div>
          ) : (
            <>
              <ul className="divide-y divide-gray-200">
                {notifications.map(n => (
                  <li key={n.id} className={`px-6 py-4 flex items-start gap-4 ${!n.isRead ? 'bg-blue-50' : 'bg-white'}`}>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {!n.isRead && (
                          <span className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />
                        )}
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${priorityColors[n.priority] || priorityColors.MEDIUM}`}>
                          {n.priority}
                        </span>
                        <span className="text-xs text-gray-400 uppercase tracking-wide">{n.type.replace(/_/g, ' ')}</span>
                      </div>
                      <p className="font-medium text-gray-900">{n.title}</p>
                      <p className="text-sm text-gray-600 mt-0.5">{n.message}</p>
                      <p className="text-xs text-gray-400 mt-1">{new Date(n.createdAt).toLocaleString()}</p>
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      {!n.isRead && (
                        <Button variant="ghost" size="sm" onClick={() => markRead(n.id)}>
                          Mark Read
                        </Button>
                      )}
                      <Button variant="ghost" size="sm" onClick={() => deleteNotification(n.id)}>
                        Delete
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
              <Pagination
                page={page}
                totalPages={totalPages}
                total={total}
                limit={limit}
                onPageChange={setPage}
              />
            </>
          )}
        </div>
      </div>
    </>
  );
}
