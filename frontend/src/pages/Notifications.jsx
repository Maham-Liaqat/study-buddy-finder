import React, { useState, useEffect, useRef } from 'react';
import axios from '../axios';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../components/ToastContext';
import { io } from 'socket.io-client';
import { jwtDecode } from 'jwt-decode';
import { motion, AnimatePresence } from 'framer-motion';
import config from '../config';

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

    socketRef.current = io(config.SOCKET_URL, {
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

  const handleAcceptRequest = async (notification) => {
    try {
      // Find the pending request for this notification
      const requestsRes = await axios.get('/api/requests/received', {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      const pendingRequest = requestsRes.data.find(req => 
        req.senderId._id === notification.relatedUserId._id || 
        req.senderId._id === notification.relatedUserId
      );
      
      if (pendingRequest) {
        await axios.patch(`/api/requests/${pendingRequest._id}/accept`, {}, {
          headers: { Authorization: `Bearer ${token}` },
        });
        
        // Remove the notification and update the list
        setNotifications(prev => prev.filter(n => n._id !== notification._id));
        addToast('Request accepted successfully!', 'success');
      }
    } catch (err) {
      const errorMessage = err.response?.data?.error || 'Failed to accept request.';
      addToast(errorMessage, 'error');
      console.error('Accept request error:', err.message, err.response?.data);
    }
  };

  const handleRejectRequest = async (notification) => {
    try {
      // Find the pending request for this notification
      const requestsRes = await axios.get('/api/requests/received', {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      const pendingRequest = requestsRes.data.find(req => 
        req.senderId._id === notification.relatedUserId._id || 
        req.senderId._id === notification.relatedUserId
      );
      
      if (pendingRequest) {
        await axios.patch(`/api/requests/${pendingRequest._id}/reject`, {}, {
          headers: { Authorization: `Bearer ${token}` },
        });
        
        // Remove the notification and update the list
        setNotifications(prev => prev.filter(n => n._id !== notification._id));
        addToast('Request rejected successfully!', 'success');
      }
    } catch (err) {
      const errorMessage = err.response?.data?.error || 'Failed to reject request.';
      addToast(errorMessage, 'error');
      console.error('Reject request error:', err.message, err.response?.data);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-lg text-gray-700">Loading notifications...</p>
      </div>
    </div>
  );
  
  if (error) return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
      <div className="text-center">
        <p className="text-red-500 text-lg">{error}</p>
      </div>
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50"
    >
      <div className="container mx-auto p-6">
        <motion.h1
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="text-4xl font-bold mb-8 text-center bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"
        >
          Notifications
        </motion.h1>
        {notifications.length ? (
          <div className="max-w-2xl mx-auto space-y-4">
            <AnimatePresence>
              {notifications.map((notification, index) => (
                <motion.div
                  key={notification._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  className={`p-6 rounded-2xl shadow-lg transition-all duration-300 ${
                    notification.read 
                      ? 'bg-white/60 backdrop-blur-sm border border-gray-200/50' 
                      : 'bg-white/80 backdrop-blur-sm border border-blue-200/50 shadow-xl'
                  } hover:shadow-xl`}
                >
                  <div 
                    onClick={() => handleNotificationClick(notification)}
                    className="cursor-pointer"
                  >
                    <p className="text-lg text-gray-800 mb-2">{notification.message}</p>
                    <p className="text-sm text-gray-500">
                      {new Date(notification.createdAt).toLocaleString()}
                    </p>
                  </div>
                  
                  {/* Show accept/reject buttons for request notifications */}
                  {notification.type === 'request' && !notification.read && (
                    <div className="flex gap-3 mt-4">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleAcceptRequest(notification)}
                        className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl hover:shadow-lg transition-all duration-300 font-semibold"
                      >
                        Accept
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleRejectRequest(notification)}
                        className="px-6 py-3 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-xl hover:shadow-lg transition-all duration-300 font-semibold"
                      >
                        Decline
                      </motion.button>
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="text-center"
          >
            <div className="bg-white/80 backdrop-blur-sm border border-blue-200/50 p-8 rounded-2xl shadow-xl max-w-md mx-auto">
              <p className="text-lg text-gray-600">No notifications yet.</p>
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

export default Notifications;