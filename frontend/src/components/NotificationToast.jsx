import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { FaBell, FaCalendarAlt, FaUserPlus, FaComments, FaTimes } from 'react-icons/fa';

const NotificationToast = ({ notifications, onRemove, onMarkAsRead }) => {
  const navigate = useNavigate();

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'session':
        return <FaCalendarAlt className="text-teal-500" />;
      case 'connection':
        return <FaUserPlus className="text-blue-500" />;
      case 'message':
        return <FaComments className="text-green-500" />;
      default:
        return <FaBell className="text-gray-500" />;
    }
  };

  const getNotificationAction = (notification) => {
    switch (notification.type) {
      case 'session':
        return () => navigate('/sessions');
      case 'connection':
        return () => navigate('/requests');
      case 'message':
        return () => navigate('/chat');
      default:
        return () => navigate('/notifications');
    }
  };

  const getNotificationTitle = (type) => {
    switch (type) {
      case 'session':
        return 'Session Reminder';
      case 'connection':
        return 'New Connection Request';
      case 'message':
        return 'New Message';
      default:
        return 'Notification';
    }
  };

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm">
      <AnimatePresence>
        {notifications.map((notification) => (
          <motion.div
            key={notification._id || notification.id}
            initial={{ opacity: 0, x: 300, scale: 0.8 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 300, scale: 0.8 }}
            transition={{ duration: 0.3, type: "spring", stiffness: 200 }}
            className={`p-4 rounded-lg shadow-lg border-l-4 cursor-pointer transform hover:scale-105 transition-all duration-200 ${
              notification.read 
                ? 'bg-gray-100 border-gray-400 text-gray-700' 
                : 'bg-white border-teal-500 text-gray-900 shadow-xl'
            }`}
            onClick={() => {
              getNotificationAction(notification)();
              if (!notification.read && onMarkAsRead) {
                onMarkAsRead(notification._id || notification.id);
              }
            }}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3 flex-1">
                <div className="mt-1">
                  {getNotificationIcon(notification.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold text-sm">
                      {getNotificationTitle(notification.type)}
                    </h4>
                    {!notification.read && (
                      <div className="w-2 h-2 bg-teal-500 rounded-full"></div>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {notification.message}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(notification.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onRemove(notification._id || notification.id);
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors ml-2"
              >
                <FaTimes size={14} />
              </button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

export default NotificationToast; 