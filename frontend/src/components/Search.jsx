import React, { useState, useEffect } from 'react';
import axios from '../axios';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../components/ToastContext';
import { motion } from 'framer-motion';

const BACKEND_URL = 'http://localhost:5001';

const Search = () => {
  const [users, setUsers] = useState([]);
  const [filters, setFilters] = useState({
    subject: '',
    availability: '',
    location: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const token = localStorage.getItem('token');
  const navigate = useNavigate();
  const { addToast } = useToast();

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError('');
      const query = new URLSearchParams(filters).toString();
      const res = await axios.get(`/api/users/search?${query}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log('Search results:', res.data);
      setUsers(res.data);
    } catch (err) {
      if (err.response?.status === 401) {
        localStorage.removeItem('token');
        addToast('Session expired. Please log in again.', 'error');
        navigate('/login');
      } else {
        const errorMessage = err.response?.data?.error || 'Failed to search users.';
        setError(errorMessage);
        addToast(errorMessage, 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [token, navigate, addToast]);

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchUsers();
  };

  const handleConnect = async (userId) => {
    try {
      console.log('Sending connection request to user:', userId);
      await axios.post('/api/requests', { recipientId: userId });
      addToast('Connection request sent!', 'success');
      setUsers(users.map(user =>
        user._id === userId ? { ...user, connectionStatus: 'pending' } : user
      ));
    } catch (err) {
      console.error('Failed to send connection request:', err);
      const errorMessage = err.response?.data?.error || 'Failed to send connection request.';
      addToast(errorMessage, 'error');
    }
  };

  const handleAvatarError = (e) => {
    console.error('Avatar failed to load for user, reverting to placeholder:', e.target.src);
    e.target.src = 'https://via.placeholder.com/40?text=User';
    e.target.onerror = null;
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
      <h1 className="text-3xl font-bold mb-6 text-gray-900">Search Study Buddies</h1>
      <form onSubmit={handleSearch} className="bg-gray-800 text-white p-6 rounded-xl shadow-lg mb-6">
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <input
            type="text"
            name="subject"
            value={filters.subject}
            onChange={handleFilterChange}
            placeholder="Subject (e.g., Calculus)"
            className="p-3 bg-gray-700 text-white text-lg border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 flex-1"
          />
          <input
            type="text"
            name="availability"
            value={filters.availability}
            onChange={handleFilterChange}
            placeholder="Availability (e.g., Monday)"
            className="p-3 bg-gray-700 text-white text-lg border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 flex-1"
          />
          <input
            type="text"
            name="location"
            value={filters.location}
            onChange={handleFilterChange}
            placeholder="Location (e.g., New York)"
            className="p-3 bg-gray-700 text-white text-lg border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 flex-1"
          />
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          type="submit"
          className="px-4 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition"
        >
          Search
        </motion.button>
      </form>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {users.map((user) => {
          const avatarUrl = user.avatar
            ? `${BACKEND_URL}/uploads/avatars/${user.avatar}?t=${Date.now()}`
            : 'https://via.placeholder.com/40?text=User';
          console.log(`Avatar URL for user ${user._id}:`, avatarUrl);
          return (
            <motion.div
              key={user._id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
              className="bg-gray-800 text-white p-6 rounded-xl shadow-lg"
            >
              <div className="flex items-center space-x-4 mb-4">
                <img
                  src={avatarUrl}
                  alt={`${user.name}'s avatar`}
                  className="w-12 h-12 rounded-full"
                  onError={handleAvatarError}
                />
                <div>
                  <h2 className="text-xl font-semibold">{user.name}</h2>
                  <p className="text-gray-400">{user.university}</p>
                </div>
              </div>
              <p className="text-gray-300 mb-2">{user.bio}</p>
              <p className="text-gray-400 mb-2">Location: {user.location || 'N/A'}</p>
              <p className="text-gray-400 mb-2">Subjects: {user.subjects?.map(s => s.name).join(', ') || 'N/A'}</p>
              <p className="text-gray-400 mb-4">Availability: {user.availability?.join(', ') || 'N/A'}</p>
              <p className="text-teal-400 mb-4">Match: {user.matchPercentage}%</p>
              {user.connectionStatus === 'pending' ? (
                <p className="text-yellow-400">Request Pending</p>
              ) : user.connectionStatus === 'accepted' ? (
                <p className="text-green-400">Connected</p>
              ) : (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleConnect(user._id)}
                  className="px-4 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition"
                >
                  Connect
                </motion.button>
              )}
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
};

export default Search;