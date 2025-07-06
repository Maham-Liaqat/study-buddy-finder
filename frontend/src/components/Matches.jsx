import React, { useState, useEffect } from 'react';
import axios from '../axios';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../components/ToastContext';
import { motion } from 'framer-motion';
import config from '../config';

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
        console.log('Matches data:', res.data);
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

  if (loading) return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-lg text-gray-700">Loading your matches...</p>
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
          My Study Buddies
        </motion.h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {matches.map((match, index) => (
            <motion.div
              key={match.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              className="bg-white/80 backdrop-blur-sm border border-blue-200/50 p-6 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300"
            >
              <div className="flex items-center space-x-4 mb-4">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white text-xl font-bold shadow-lg">
                  {match.name.split(' ').map(word => word[0]).join('')}
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-bold text-gray-800">{match.name}</h2>
                  <p className="text-gray-600">{match.university}</p>
                </div>
              </div>
              <p className="text-gray-700 mb-3 leading-relaxed">{match.bio}</p>
              <div className="space-y-2 mb-4">
                <p className="text-gray-600">📍 {match.location || 'Location not specified'}</p>
                <p className="text-gray-600">📚 {match.subjects?.join(', ') || 'No subjects specified'}</p>
                <p className="text-gray-600">⏰ {match.availability?.join(', ') || 'No availability specified'}</p>
              </div>
              {match.connectionStatus === 'accepted' ? (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleChat(match.id)}
                  className="w-full bg-gradient-to-r from-blue-500 to-purple-500 text-white py-3 px-6 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  Start Chat
                </motion.button>
              ) : (
                <div className="w-full bg-gradient-to-r from-yellow-400 to-orange-400 text-white py-3 px-6 rounded-xl font-semibold text-center shadow-lg">
                  Request Pending
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

export default Matches;