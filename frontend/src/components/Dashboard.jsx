import React, { useState, useEffect } from 'react';
import axios from '../axios';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../components/ToastContext';
import { motion } from 'framer-motion';

const BACKEND_URL = 'http://localhost:5001';

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const token = localStorage.getItem('token');
  const navigate = useNavigate();
  const { addToast } = useToast();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await axios.get('/api/users/me', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUser(res.data);
      } catch (err) {
        if (err.response?.status === 401) {
          localStorage.removeItem('token');
          addToast('Session expired. Please log in again.', 'error');
          navigate('/login');
        } else {
          const errorMessage = err.response?.data?.error || 'Failed to fetch user data.';
          setError(errorMessage);
          addToast(errorMessage, 'error');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [token, navigate, addToast]);

  const handleNavigation = (path) => {
    navigate(path);
  };

  if (loading) return <div className="container mx-auto p-6 min-h-screen bg-gray-100"><p className="text-lg text-gray-900">Loading...</p></div>;
  if (error) return <div className="container mx-auto p-6 min-h-screen bg-gray-100"><p className="text-red-400 text-lg">{error}</p></div>;

  const avatarUrl = user?.avatar ? `${BACKEND_URL}/uploads/avatars/${user.avatar}` : 'https://via.placeholder.com/40?text=User';
  console.log('Avatar URL:', avatarUrl);

  // Animation variants for the buttons
  const buttonContainerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1, // Stagger the entrance of each button
      },
    },
  };

  const buttonVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
    hover: { scale: 1.05 },
    tap: { scale: 0.95 },
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="container mx-auto p-6 min-h-screen bg-gray-100"
    >
      <h1 className="text-3xl font-bold mb-6 text-gray-900">Welcome, {user?.name}!</h1>
      <div className="bg-gray-800 text-white p-6 rounded-xl shadow-lg">
        <div className="flex items-center space-x-4 mb-6">
          <img
            src={avatarUrl}
            alt="User avatar"
            className="w-16 h-16 rounded-full"
            onError={(e) => (e.target.src = 'https://via.placeholder.com/40?text=User')}
          />
          <motion.div
            className="flex flex-wrap gap-3"
            variants={buttonContainerVariants}
            initial="hidden"
            animate="visible"
          >
            <motion.button
              variants={buttonVariants}
              whileHover="hover"
              whileTap="tap"
              onClick={() => handleNavigation('/profile')}
              className="px-4 py-2 bg-teal-500 text-white text-lg rounded-lg hover:bg-teal-600 transition"
            >
              Profile
            </motion.button>
            <motion.button
              variants={buttonVariants}
              whileHover="hover"
              whileTap="tap"
              onClick={() => handleNavigation('/search')}
              className="px-4 py-2 bg-teal-500 text-white text-lg rounded-lg hover:bg-teal-600 transition"
            >
              Search
            </motion.button>
            <motion.button
              variants={buttonVariants}
              whileHover="hover"
              whileTap="tap"
              onClick={() => handleNavigation('/matches')}
              className="px-4 py-2 bg-teal-500 text-white text-lg rounded-lg hover:bg-teal-600 transition"
            >
              Matches
            </motion.button>
            <motion.button
              variants={buttonVariants}
              whileHover="hover"
              whileTap="tap"
              onClick={() => handleNavigation('/chat')}
              className="px-4 py-2 bg-teal-500 text-white text-lg rounded-lg hover:bg-teal-600 transition"
            >
              Chat
            </motion.button>
            <motion.button
              variants={buttonVariants}
              whileHover="hover"
              whileTap="tap"
              onClick={() => handleNavigation('/notifications')}
              className="px-4 py-2 bg-teal-500 text-white text-lg rounded-lg hover:bg-teal-600 transition"
            >
              Notifications
            </motion.button>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
};

export default Dashboard;