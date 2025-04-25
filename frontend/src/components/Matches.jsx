import React, { useState, useEffect } from 'react';
import axios from '../axios';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../components/ToastContext';
import { motion } from 'framer-motion';

const BACKEND_URL = 'http://localhost:5001';

const Matches = () => {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const token = localStorage.getItem('token');
  const navigate = useNavigate();
  const { addToast } = useToast();

  useEffect(() => {
    const fetchMatches = async () => {
      if (!token) {
        setError('Please log in to view your matches.');
        addToast('Please log in to view your matches.', 'error');
        navigate('/login');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError('');
        const res = await axios.get('/api/users/matches', {
          headers: { Authorization: `Bearer ${token}` },
        });
        console.log('Matches data:', res.data); // Debug log
        setMatches(res.data);
      } catch (err) {
        if (err.response?.status === 401) {
          localStorage.removeItem('token');
          addToast('Session expired. Please log in again.', 'error');
          navigate('/login');
        } else {
          const errorMessage = err.response?.data?.error || 'Failed to load matches. Please try again later.';
          setError(errorMessage);
          addToast(errorMessage, 'error');
        }
      } finally {
        setLoading(false);
      }
    };
    fetchMatches();
  }, [token, navigate, addToast]);

  const handleChat = (userId) => {
    navigate(`/chat/${userId}`);
  };

  const handleAvatarError = (e) => {
    console.error('Avatar failed to load for match, reverting to placeholder:', e.target.src);
    e.target.src = 'https://via.placeholder.com/40?text=User';
    e.target.onerror = null; // Prevent infinite loop
  };

  if (loading) return <div className="container mx-auto p-6 min-h-screen bg-gray-100"><p className="text-lg text-gray-900">Loading...</p></div>;
  if (error) return <div className="container mx-auto p-6 min-h-screen bg-gray-100"><p className="text-red-400 text-lg">{error}</p></div>;

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="container mx-auto p-6 min-h-screen bg-gray-100"
    >
      <h1 className="text-3xl font-bold mb-6 text-gray-900">My Matches</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {matches.map((match) => {
          const avatarUrl = match.avatar
            ? `${BACKEND_URL}/uploads/avatars/${match.avatar}?t=${Date.now()}`
            : 'https://via.placeholder.com/40?text=User';
          console.log(`Avatar URL for match ${match.id}:`, avatarUrl); // Debug log
          return (
            <motion.div
              key={match.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
              className="bg-gray-800 text-white p-6 rounded-xl shadow-lg"
            >
              <div className="flex items-center space-x-4 mb-4">
                <img
                  src={avatarUrl}
                  alt={`${match.name}'s avatar`}
                  className="w-12 h-12 rounded-full"
                  onError={handleAvatarError}
                />
                <div>
                  <h2 className="text-xl font-semibold">{match.name}</h2>
                  <p className="text-gray-400">{match.university}</p>
                </div>
              </div>
              <p className="text-gray-300 mb-2">{match.bio}</p>
              <p className="text-gray-400 mb-2">Location: {match.location || 'N/A'}</p>
              <p className="text-gray-400 mb-2">Subjects: {match.subjects?.join(', ') || 'N/A'}</p>
              <p className="text-gray-400 mb-4">Availability: {match.availability?.join(', ') || 'N/A'}</p>
              {match.connectionStatus === 'accepted' ? (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleChat(match.id)}
                  className="px-4 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition"
                >
                  Chat
                </motion.button>
              ) : (
                <p className="text-yellow-400">Request Pending</p>
              )}
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
};

export default Matches;