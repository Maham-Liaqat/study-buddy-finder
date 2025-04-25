import React, { useState, useEffect, useRef } from 'react';
import axios from '../axios';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../components/ToastContext';
import { io } from 'socket.io-client';
import { jwtDecode } from 'jwt-decode';
import { motion, AnimatePresence } from 'framer-motion';

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const token = localStorage.getItem('token');
  const navigate = useNavigate();
  const { addToast } = useToast();
  const socketRef = useRef(null);

  useEffect(() => {
    if (!token) {
      setError('Please log in.');
      setLoading(false);
      navigate('/login');
      return;
    }

    const decoded = jwtDecode(token);
    const userId = decoded.userId;

    socketRef.current = io('http://localhost:5001', {
      query: { userId },
    });

    socketRef.current.on('connect', () => {
      console.log('Connected to Socket.IO server for notifications');
      socketRef.current.emit('join', userId);
    });

    socketRef.current.on('newNotification', (notification) => {
      setNotifications((prev) => [notification, ...prev]);
    });

    return () => {
      socketRef.current.off('newNotification');
      socketRef.current.disconnect();
    };
  }, [token, navigate]);

  useEffect(() => {
    const fetchNotifications = async () => {
      if (!token) return;

      try {
        setLoading(true);
        const res = await axios.get('/api/notifications', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setNotifications(res.data);
      } catch (err) {
        if (err.response?.status === 401) {
          localStorage.removeItem('token');
          setError('Session expired. Redirecting to login...');
          addToast('Session expired. Redirecting to login...', 'error');
          setTimeout(() => navigate('/login'), 3000);
        } else {
          const errorMessage = err.response?.data?.error || 'Failed to fetch notifications.';
          setError(errorMessage);
          addToast(errorMessage, 'error');
          console.error('Fetch notifications error:', err.message, err.response?.data);
        }
      } finally {
        setLoading(false);
      }
    };
    fetchNotifications();
  }, [token, navigate, addToast]);

  const handleNotificationClick = (notification) => {
    if (notification.type === 'message') {
      navigate(`/chat/${notification.relatedUserId._id || notification.relatedUserId}`);
    }
  };

  if (loading) return <div className="container mx-auto p-6 min-h-screen bg-gray-100"><p className="text-lg text-gray-900">Loading notifications...</p></div>;
  if (error) return <div className="container mx-auto p-6 min-h-screen bg-gray-100"><p className="text-red-400 text-lg">{error}</p></div>;

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="container mx-auto p-6 min-h-screen bg-gray-100"
    >
      <motion.h1
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        className="text-4xl font-bold mb-6 text-gray-900"
      >
        Notifications
      </motion.h1>
      {notifications.length ? (
        <div className="space-y-4">
          <AnimatePresence>
            {notifications.map((notification, index) => (
              <motion.div
                key={notification._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                onClick={() => handleNotificationClick(notification)}
                className={`p-4 rounded-lg cursor-pointer ${
                  notification.read ? 'bg-gray-200' : 'bg-white shadow-lg'
                } hover:bg-gray-100 transition`}
              >
                <p className="text-lg text-gray-900">{notification.message}</p>
                <p className="text-sm text-gray-500">
                  {new Date(notification.createdAt).toLocaleString()}
                </p>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      ) : (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="text-lg text-gray-500"
        >
          No notifications yet.
        </motion.p>
      )}
    </motion.div>
  );
};

export default Notifications;