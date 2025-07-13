import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useToast } from './ToastContext';
import NotificationToast from './NotificationToast';
import io from 'socket.io-client';
import config from '../config';

const NotificationManager = () => {
  const [notifications, setNotifications] = useState([]);
  const [socket, setSocket] = useState(null);
  const { token } = useContext(AuthContext);
  const { addToast } = useToast();

  useEffect(() => {
    if (!token) return;

    // Connect to socket
    const newSocket = io(config.BACKEND_URL, {
      auth: { token }
    });

    newSocket.on('connect', () => {
      console.log('Connected to notification socket');
    });

    newSocket.on('notification', (notification) => {
      setNotifications(prev => [notification, ...prev]);
      
      // Show toast for new notifications
      addToast(notification.message, 'info');
    });

    newSocket.on('session_reminder', (notification) => {
      setNotifications(prev => [notification, ...prev]);
      
      // Show special toast for session reminders
      addToast(`⏰ ${notification.message}`, 'warning');
    });

    setSocket(newSocket);

    // Fetch existing notifications
    fetchNotifications();

    return () => {
      newSocket.disconnect();
    };
  }, [token]);

  const fetchNotifications = async () => {
    try {
      const response = await fetch(`${config.BACKEND_URL}/api/notifications`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      setNotifications(data);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      await fetch(`${config.BACKEND_URL}/api/notifications/${notificationId}/read`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      setNotifications(prev => 
        prev.map(n => 
          n._id === notificationId ? { ...n, read: true } : n
        )
      );
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const removeNotification = (notificationId) => {
    setNotifications(prev => prev.filter(n => n._id !== notificationId));
  };

  return (
    <NotificationToast
      notifications={notifications.slice(0, 3)} // Show only top 3
      onRemove={removeNotification}
      onMarkAsRead={markAsRead}
    />
  );
};

export default NotificationManager; 