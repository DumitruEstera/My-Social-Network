import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

const NotificationContext = createContext();

export function useNotifications() {
  return useContext(NotificationContext);
}

export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const { token, isAuthenticated } = useAuth();

  // Fetch notifications when the component mounts
  useEffect(() => {
    const fetchNotifications = async () => {
      if (!isAuthenticated) {
        setNotifications([]);
        setUnreadCount(0);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const response = await fetch('http://localhost:5050/notifications', {
          headers: {
            'x-auth-token': token
          }
        });

        if (response.ok) {
          const data = await response.json();
          setNotifications(data);
          
          // Count unread notifications
          const unread = data.filter(notif => !notif.read).length;
          setUnreadCount(unread);
        }
      } catch (error) {
        console.error('Error fetching notifications:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
    
    // Set up interval to check for new notifications every minute
    const intervalId = setInterval(fetchNotifications, 60000);
    
    // Clean up interval on unmount
    return () => clearInterval(intervalId);
  }, [token, isAuthenticated]);

  // Function to refresh notifications
  const refreshNotifications = async () => {
    if (!isAuthenticated) return;
    
    try {
      const response = await fetch('http://localhost:5050/notifications', {
        headers: {
          'x-auth-token': token
        }
      });

      if (response.ok) {
        const data = await response.json();
        setNotifications(data);
        
        // Count unread notifications
        const unread = data.filter(notif => !notif.read).length;
        setUnreadCount(unread);
      }
    } catch (error) {
      console.error('Error refreshing notifications:', error);
    }
  };

  // Mark a notification as read
  const markAsRead = async (notificationId) => {
    if (!isAuthenticated) return;
    
    try {
      const response = await fetch(`http://localhost:5050/notifications/${notificationId}/read`, {
        method: 'PATCH',
        headers: {
          'x-auth-token': token
        }
      });

      if (response.ok) {
        // Update the local state
        setNotifications(prevNotifications => 
          prevNotifications.map(notif => 
            notif._id === notificationId ? { ...notif, read: true } : notif
          )
        );
        
        // Update unread count
        setUnreadCount(prevCount => Math.max(0, prevCount - 1));
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
    if (!isAuthenticated) return;
    
    try {
      const response = await fetch(`http://localhost:5050/notifications/mark-all-read`, {
        method: 'PATCH',
        headers: {
          'x-auth-token': token
        }
      });

      if (response.ok) {
        // Update the local state
        setNotifications(prevNotifications => 
          prevNotifications.map(notif => ({ ...notif, read: true }))
        );
        
        // Update unread count
        setUnreadCount(0);
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  // Delete a notification
  const deleteNotification = async (notificationId) => {
    if (!isAuthenticated) return;
    
    try {
      const response = await fetch(`http://localhost:5050/notifications/${notificationId}`, {
        method: 'DELETE',
        headers: {
          'x-auth-token': token
        }
      });

      if (response.ok) {
        // Update the local state
        const deletedNotification = notifications.find(n => n._id === notificationId);
        const wasUnread = deletedNotification && !deletedNotification.read;
        
        setNotifications(prevNotifications => 
          prevNotifications.filter(notif => notif._id !== notificationId)
        );
        
        // Update unread count if the deleted notification was unread
        if (wasUnread) {
          setUnreadCount(prevCount => Math.max(0, prevCount - 1));
        }
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const value = {
    notifications,
    unreadCount,
    loading,
    refreshNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}