import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Bell, CheckCheck, X, AlertCircle, IndianRupee, Zap } from 'lucide-react';
import alertService from '../../services/alertService';

const NotificationBell = () => {
  const [alerts, setAlerts] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // ─── Fetch alerts + unread count from server ───────────────────────────────
  const fetchNotifications = useCallback(async () => {
    try {
      const [data, countData] = await Promise.all([
        alertService.getAlerts(),
        alertService.getUnreadCount(),
      ]);
      setAlerts(data);
      setUnreadCount(countData.unread_count);
    } catch (err) {
      console.error('Error fetching notifications:', err);
    }
  }, []);

  // On mount: load once + poll every 30s to pick up new system-generated alerts
  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  // Re-sync from server whenever the dropdown is opened
  useEffect(() => {
    if (isOpen) fetchNotifications();
  }, [isOpen, fetchNotifications]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ─── MARK AS READ ──────────────────────────────────────────────────────────
  // Alert STAYS in list. Badge count goes DOWN by 1.
  const handleMarkAsRead = async (id) => {
    // Optimistic update — instant UI, no waiting for API
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, read_status: true } : a));
    setUnreadCount(prev => Math.max(0, prev - 1));
    try {
      await alertService.markAlertAsRead(id);
    } catch (err) {
      console.error('Mark as read failed:', err);
      fetchNotifications(); // rollback: re-sync from server on failure
    }
  };

  // ─── CANCEL / DELETE ───────────────────────────────────────────────────────
  // Alert is REMOVED from list. Badge count goes DOWN by 1 only if it was unread.
  const handleDelete = async (id) => {
    const target = alerts.find(a => a.id === id);
    // Optimistic update — instant UI, no waiting for API
    setAlerts(prev => prev.filter(a => a.id !== id));
    if (target && !target.read_status) {
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
    try {
      await alertService.deleteAlert(id);
    } catch (err) {
      console.error('Delete failed:', err);
      fetchNotifications(); // rollback: re-sync from server on failure
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case 'low_balance':     return <IndianRupee className="text-orange-500" size={16} />;
      case 'budget_exceeded': return <AlertCircle className="text-red-500" size={16} />;
      case 'bill_due':        return <Zap className="text-yellow-500" size={16} />;
      default:                return <Bell size={16} />;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>

      {/* ── Bell button ───────────────────────────────────────────────────── */}
      <button
        onClick={() => setIsOpen(prev => !prev)}
        className="relative p-2 text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
      >
        <Bell size={24} />
        {/* Badge: shows unread count — disappears when all alerts are read/cleared */}
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex h-5 w-5 items-center justify-center
            rounded-full bg-red-500 text-[10px] font-bold text-white border-2 border-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* ── Dropdown ─────────────────────────────────────────────────────── */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-2xl
          border border-gray-100 z-[100] overflow-hidden">

          {/* Header — title + unread count only, NO clear-all button */}
          <div className="p-4 border-b bg-gray-50">
            <h3 className="font-bold text-gray-800 flex items-center gap-2">
              Notifications
              {unreadCount > 0 && (
                <span className="text-xs bg-red-100 text-red-600 font-semibold px-2 py-0.5 rounded-full">
                  {unreadCount} unread
                </span>
              )}
            </h3>
          </div>

          {/* Alert list */}
          <div className="max-h-[420px] overflow-y-auto divide-y divide-gray-100">
            {alerts.length === 0 ? (
              <div className="p-8 text-center text-gray-400">
                <Bell className="mx-auto mb-2 opacity-20" size={40} />
                <p className="text-sm font-medium">You're all caught up!</p>
              </div>
            ) : (
              alerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`p-4 relative transition-colors ${
                    !alert.read_status ? 'bg-blue-50/60' : 'bg-white'
                  }`}
                >
                  {/* Blue dot — indicates unread */}
                  {!alert.read_status && (
                    <span className="absolute left-1.5 top-1/2 -translate-y-1/2
                      w-1.5 h-1.5 rounded-full bg-blue-500" />
                  )}

                  {/* Message content */}
                  <div className="flex gap-3 pl-2 pr-[72px]">
                    <div className="mt-0.5 shrink-0">{getIcon(alert.alert_type)}</div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm leading-snug ${
                        !alert.read_status
                          ? 'font-semibold text-gray-900'
                          : 'font-normal text-gray-500'
                      }`}>
                        {alert.message}
                      </p>
                      <p className="text-[10px] text-gray-400 mt-1">
                        {new Date(alert.created_at).toLocaleString('en-IN', {
                          day: '2-digit', month: 'short',
                          hour: '2-digit', minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </div>

                  {/* ── Action buttons — always visible, fixed to right side ── */}
                  <div className="absolute top-1/2 -translate-y-1/2 right-3 flex items-center gap-1">

                    {/* ✓ Mark as read — only shown if alert is unread */}
                    {!alert.read_status && (
                      <button
                        onClick={() => handleMarkAsRead(alert.id)}
                        title="Mark as read"
                        className="p-1.5 rounded-lg border border-gray-200 bg-white
                          text-gray-400 hover:text-green-600 hover:border-green-300
                          transition-colors shadow-sm"
                      >
                        <CheckCheck size={13} />
                      </button>
                    )}

                    {/* ✕ Cancel — always shown, removes alert from list */}
                    <button
                      onClick={() => handleDelete(alert.id)}
                      title="Dismiss"
                      className="p-1.5 rounded-lg border border-gray-200 bg-white
                        text-gray-400 hover:text-red-600 hover:border-red-300
                        transition-colors shadow-sm"
                    >
                      <X size={13} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
