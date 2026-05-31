import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from './AuthContext';

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const { user } = useAuth();

  const fetchNotifications = async () => {
    if (!user) return;
    try {
      const res = await api.get('/notifications');
      if (res.data.success) {
        setNotifications(res.data.data);
        const unread = res.data.data.filter((n) => !n.isRead).length;
        setUnreadCount(unread);
      }
    } catch (err) {
      console.error('Error fetching notifications: ', err);
    }
  };

  useEffect(() => {
    if (user) {
      fetchNotifications();
      // Set up simple periodic polling for new notifications (e.g. every 12 seconds)
      // This simulates a live Web Socket / Firebase Cloud Messaging listener!
      const interval = setInterval(fetchNotifications, 12000);
      return () => clearInterval(interval);
    } else {
      setNotifications([]);
      setUnreadCount(0);
    }
  }, [user]);

  const markRead = async (id) => {
    try {
      const res = await api.put(`/notifications/${id}`);
      if (res.data.success) {
        setNotifications((prev) =>
          prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
        );
        setUnreadCount((c) => Math.max(0, c - 1));
      }
    } catch (err) {
      console.error('Error marking notification read: ', err);
    }
  };

  const markAllRead = async () => {
    try {
      const res = await api.put('/notifications/read-all');
      if (res.data.success) {
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
        setUnreadCount(0);
      }
    } catch (err) {
      console.error('Error marking all notifications read: ', err);
    }
  };

  // Simulated push trigger to instantly spawn in-app notifications
  const triggerPushNotification = async (message, type = 'General') => {
    if (!user) return;
    try {
      // Typically created by backend, but we can hit a backend notifier or mock locally
      // For this app, let's create a notification in database so it persists!
      // Since there's no direct mock post route for notifications, we can simulate locally:
      const mockNotif = {
        _id: 'mock_' + Date.now(),
        message,
        type,
        isRead: false,
        createdAt: new Date().toISOString(),
      };
      setNotifications((prev) => [mockNotif, ...prev]);
      setUnreadCount((c) => c + 1);

      // Play audio chime if user allows
      try {
        const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-500.wav');
        audio.volume = 0.3;
        audio.play();
      } catch (e) {
        // browser audio policy blocked
      }
    } catch (err) {
      console.error('Error spawning custom alert: ', err);
    }
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        fetchNotifications,
        markRead,
        markAllRead,
        triggerPushNotification,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => useContext(NotificationContext);
