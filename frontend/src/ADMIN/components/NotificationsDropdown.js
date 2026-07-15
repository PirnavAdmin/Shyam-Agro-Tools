import React, { useState, useEffect, useRef } from 'react';
import { 
  Bell, 
  AlertTriangle, 
  ShoppingBag, 
  Info, 
  CheckCircle2,
  Trash2,
  Loader2
} from 'lucide-react';
import { 
  getNotifications, 
  getUnreadCount, 
  markAsRead, 
  markAllAsRead, 
  deleteNotification, 
  clearAllNotifications 
} from '../api/notifications';

const NotificationsDropdown = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const dropdownRef = useRef(null);

  // Helper to format relative time (e.g., "5 mins ago")
  const formatRelativeTime = (dateString) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now - date;
      if (isNaN(diffMs) || diffMs < 0) return 'Just now';

      const diffSecs = Math.floor(diffMs / 1000);
      const diffMins = Math.floor(diffSecs / 60);
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffSecs < 60) return 'Just now';
      if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
      if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
      if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;

      return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
    } catch (e) {
      return '';
    }
  };

  // Map API type to CSS class and Lucide icon
  const getNotifConfig = (type) => {
    const t = (type || '').toLowerCase();
    if (t.includes('warning') || t.includes('lowstock') || t.includes('stock')) {
      return {
        className: 'warning',
        icon: <AlertTriangle size={15} className="text-amber-600" />
      };
    }
    if (t.includes('success') || t.includes('order') || t.includes('placed') || t.includes('added') || t.includes('register')) {
      return {
        className: 'success',
        icon: <ShoppingBag size={15} className="text-emerald-600" />
      };
    }
    return {
      className: 'info',
      icon: <Info size={15} className="text-blue-600" />
    };
  };

  // Fetch unread count
  const fetchUnreadCount = async () => {
    try {
      const count = await getUnreadCount();
      setUnreadCount(count);
    } catch (err) {
      console.error('Error fetching unread count:', err);
    }
  };

  // Fetch full notifications list
  const fetchNotifications = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    setError(null);
    try {
      const data = await getNotifications();
      // Sort notifications by ID desc (or date desc) so newest are at the top
      const sortedData = data.sort((a, b) => b.id - a.id);
      setNotifications(sortedData);
      // Recalculate unread count from fetched list
      const count = sortedData.filter(n => !n.isRead).length;
      setUnreadCount(count);
    } catch (err) {
      console.error('Error fetching notifications:', err);
      setError('Failed to load notifications.');
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  // Initial load and polling for unread count
  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000); // poll every 30s
    return () => clearInterval(interval);
  }, []);

  // Fetch notifications when dropdown opens
  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen]);

  // Click outside detection
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handlers
  const handleToggle = () => {
    setIsOpen(!isOpen);
  };

  const handleMarkAsRead = async (id) => {
    // Find the item in state
    const notif = notifications.find(n => n.id === id);
    if (!notif || notif.isRead) return;

    // Optimistic update
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    setUnreadCount(prev => Math.max(0, prev - 1));

    try {
      await markAsRead(id);
    } catch (err) {
      console.error(`Failed to mark notification ${id} as read:`, err);
      // Revert on failure
      fetchNotifications(false);
    }
  };

  const handleMarkAllRead = async () => {
    if (unreadCount === 0) return;

    // Optimistic update
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    setUnreadCount(0);

    try {
      await markAllAsRead();
    } catch (err) {
      console.error('Failed to mark all as read:', err);
      fetchNotifications(false);
    }
  };

  const handleDelete = async (id) => {
    // Find if the deleted item was unread to adjust count
    const notif = notifications.find(n => n.id === id);
    const wasUnread = notif && !notif.isRead;

    // Optimistic update
    setNotifications(prev => prev.filter(n => n.id !== id));
    if (wasUnread) {
      setUnreadCount(prev => Math.max(0, prev - 1));
    }

    try {
      await deleteNotification(id);
    } catch (err) {
      console.error(`Failed to delete notification ${id}:`, err);
      fetchNotifications(false);
    }
  };

  const handleClearAll = async () => {
    if (notifications.length === 0) return;

    // Optimistic update
    setNotifications([]);
    setUnreadCount(0);

    try {
      await clearAllNotifications();
    } catch (err) {
      console.error('Failed to clear notifications:', err);
      fetchNotifications(false);
    }
  };

  return (
    <div className="topbar-notifications" ref={dropdownRef}>
      <button 
        className="notification-bell-btn" 
        onClick={handleToggle} 
        title="Notifications"
      >
        <Bell size={18} className="text-gray-700" />
        {unreadCount > 0 && <span className="bell-badge">{unreadCount}</span>}
      </button>

      {isOpen && (
        <div className="topbar-dropdown-menu notifications-dropdown">
          <div className="notifications-dropdown-header">
            <h3>Notifications</h3>
            {unreadCount > 0 && (
              <button className="mark-read-btn" onClick={handleMarkAllRead}>
                Mark all as read
              </button>
            )}
          </div>
          
          <div className="notifications-dropdown-list">
            {loading ? (
              <div className="notifications-empty-state" style={{ padding: '40px 16px' }}>
                <Loader2 className="animate-spin text-blue-600 mb-2" size={24} />
                <p>Loading notifications...</p>
              </div>
            ) : error ? (
              <div className="notifications-empty-state" style={{ padding: '40px 16px' }}>
                <AlertTriangle className="text-amber-500 mb-2" size={24} />
                <p style={{ color: '#ef4444' }}>{error}</p>
                <button 
                  onClick={() => fetchNotifications(true)} 
                  style={{
                    marginTop: '8px',
                    padding: '4px 10px',
                    fontSize: '11px',
                    border: '1px solid #cbd5e1',
                    borderRadius: '4px',
                    background: '#fff',
                    cursor: 'pointer'
                  }}
                >
                  Try Again
                </button>
              </div>
            ) : notifications.length > 0 ? (
              notifications.map((notif) => {
                const config = getNotifConfig(notif.type);
                return (
                  <div 
                    key={notif.id} 
                    className={`notification-item ${!notif.isRead ? 'unread' : ''}`}
                    onClick={() => handleMarkAsRead(notif.id)}
                  >
                    <div className={`notif-icon-wrap ${config.className}`}>
                      {config.icon}
                    </div>
                    <div className="notif-content" style={{ flex: 1 }}>
                      <h4 className="notif-title">{notif.title}</h4>
                      <p className="notif-text">{notif.message}</p>
                      <span className="notif-time">{formatRelativeTime(notif.createdAt)}</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px', minWidth: '16px' }}>
                      {!notif.isRead && <span className="unread-dot" style={{ position: 'static' }}></span>}
                      <button 
                        className="delete-notif-btn" 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(notif.id);
                        }}
                        title="Delete notification"
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#cbd5e1',
                          cursor: 'pointer',
                          padding: '2px',
                          borderRadius: '4px',
                          transition: 'color 0.15s, background-color 0.15s',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.color = '#ef4444';
                          e.currentTarget.style.backgroundColor = '#fee2e2';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.color = '#cbd5e1';
                          e.currentTarget.style.backgroundColor = 'transparent';
                        }}
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="notifications-empty-state">
                <CheckCircle2 size={36} className="text-emerald-500 mb-2" />
                <h4>All caught up!</h4>
                <p>No new notifications at this time.</p>
              </div>
            )}
          </div>

          <div className="notifications-dropdown-footer">
            {notifications.length > 0 && (
              <button className="clear-all-btn" onClick={handleClearAll}>
                Clear All
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationsDropdown;
