import React, { useState, useEffect } from 'react';
import axios from '../axios';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../components/ToastContext';
import { motion } from 'framer-motion';
import { FaStar, FaRegStar, FaBan, FaUserCircle, FaAward, FaSearch, FaMapMarkerAlt, FaGraduationCap, FaClock } from 'react-icons/fa';

const AVAIL_DAYS = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday'
];

const Search = () => {
  const [users, setUsers] = useState([]);
  const [filters, setFilters] = useState({
    subject: '',
    availability: '',
    location: '',
    skills: [],
    badges: [],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const token = localStorage.getItem('token');
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [favorites, setFavorites] = useState([]);
  const [blocked, setBlocked] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [skills, setSkills] = useState([]);
  const [badges, setBadges] = useState([]);

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

  useEffect(() => {
    axios.get('/api/users/subjects').then(res => setSubjects(res.data));
    axios.get('/api/users/skills').then(res => setSkills(res.data));
    axios.get('/api/users/badges').then(res => setBadges(res.data));
  }, []);

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchUsers();
  };

  const handleConnect = async (userId) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        addToast('Please log in to send requests.', 'error');
        navigate('/login');
        return;
      }
      console.log('Token:', token ? 'Present' : 'Missing');
      console.log('Sending connection request to user:', userId);
      const response = await axios.post('/api/requests', {
        recipientId: userId,
        message: 'Hi, would you like to study together?', // Add default message
      });
      console.log('Response:', response.data);
      addToast('Connection request sent!', 'success');
      setUsers(users.map(user =>
        user._id === userId ? { ...user, connectionStatus: 'pending' } : user
      ));
    } catch (err) {
      console.error('Failed to send connection request:', err);
      console.log('Error response:', err.response?.data);
      const errorMessage = err.response?.data?.error || 'Failed to send connection request.';
      addToast(errorMessage, 'error');
    }
  };

  const handleFavorite = (userId) => {
    setFavorites((prev) => prev.includes(userId) ? prev.filter(id => id !== userId) : [userId, ...prev]);
  };

  const handleBlock = (userId) => {
    setBlocked((prev) => prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]);
  };

  const handleMultiSelect = (name, value) => {
    setFilters((prev) => {
      const arr = prev[name] ? prev[name].split(',') : [];
      const newArr = arr.includes(value) ? arr.filter(v => v !== value) : [...arr, value];
      return { ...prev, [name]: newArr.join(',') };
    });
  };

  if (loading) return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-lg text-gray-700">Searching for study buddies...</p>
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
          Find Your Perfect Study Buddy
        </motion.h1>
        
        <motion.form 
          onSubmit={handleSearch} 
          className="bg-white/80 backdrop-blur-sm border border-blue-200/50 p-8 rounded-2xl shadow-xl mb-8"
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          <div className="flex flex-col lg:flex-row gap-6 mb-6">
            <div className="flex-1 space-y-4">
              <div className="relative">
                <FaMapMarkerAlt className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-500" />
                <input 
                  type="text" 
                  name="location" 
                  value={filters.location} 
                  onChange={handleFilterChange} 
                  placeholder="Location (e.g., New York)" 
                  className="w-full pl-10 pr-4 py-3 bg-white/70 border border-blue-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300" 
                />
              </div>
              
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-gray-700 flex items-center gap-2">
                  <FaGraduationCap className="text-blue-500" />
                  Subjects
                </h3>
            <div className="flex flex-wrap gap-2">
              {subjects.map(subj => (
                    <motion.button 
                      type="button" 
                      key={subj} 
                      onClick={() => handleMultiSelect('subject', subj)} 
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                        filters.subject.includes(subj) 
                          ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg' 
                          : 'bg-white/70 border border-blue-200 text-gray-700 hover:bg-blue-50'
                      }`}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      {subj}
                    </motion.button>
              ))}
            </div>
              </div>

              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-gray-700 flex items-center gap-2">
                  <FaClock className="text-blue-500" />
                  Availability
                </h3>
            <div className="flex flex-wrap gap-2">
              {AVAIL_DAYS.map(day => (
                    <motion.button 
                      type="button" 
                      key={day} 
                      onClick={() => handleMultiSelect('availability', day)} 
                      className={`px-3 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                        filters.availability.includes(day) 
                          ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg' 
                          : 'bg-white/70 border border-purple-200 text-gray-700 hover:bg-purple-50'
                      }`}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      {day}
                    </motion.button>
              ))}
            </div>
              </div>

              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-gray-700">Skills</h3>
            <div className="flex flex-wrap gap-2">
              {skills.map(skill => (
                    <motion.button 
                      type="button" 
                      key={skill} 
                      onClick={() => handleMultiSelect('skills', skill)} 
                      className={`px-3 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                        filters.skills?.includes(skill) 
                          ? 'bg-gradient-to-r from-indigo-500 to-blue-500 text-white shadow-lg' 
                          : 'bg-white/70 border border-indigo-200 text-gray-700 hover:bg-indigo-50'
                      }`}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      {skill}
                    </motion.button>
              ))}
            </div>
              </div>

              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-gray-700 flex items-center gap-2">
                  <FaAward className="text-yellow-500" />
                  Badges
                </h3>
            <div className="flex flex-wrap gap-2">
              {badges.map(badge => (
                    <motion.button 
                      type="button" 
                      key={badge} 
                      onClick={() => handleMultiSelect('badges', badge)} 
                      className={`px-3 py-2 rounded-full text-sm font-medium transition-all duration-300 flex items-center gap-1 ${
                        filters.badges?.includes(badge) 
                          ? 'bg-gradient-to-r from-yellow-400 to-orange-400 text-white shadow-lg' 
                          : 'bg-white/70 border border-yellow-200 text-gray-700 hover:bg-yellow-50'
                      }`}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <FaAward />{badge}
                    </motion.button>
                  ))}
                </div>
            </div>
          </div>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          type="submit"
            className="w-full bg-gradient-to-r from-blue-500 to-purple-500 text-white py-3 px-6 rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-2"
        >
            <FaSearch />
            Search Study Buddies
        </motion.button>
        </motion.form>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {favorites.concat(users.map(u => u._id).filter(id => !favorites.includes(id))).filter(id => !blocked.includes(id)).map(userId => {
          const user = users.find(u => u._id === userId);
          if (!user) return null;
          return (
              <motion.div 
                key={user._id} 
                initial={{ opacity: 0, scale: 0.9 }} 
                animate={{ opacity: 1, scale: 1 }} 
                transition={{ duration: 0.3 }}
                className="bg-white/80 backdrop-blur-sm border border-blue-200/50 p-6 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 relative group"
              >
                <div className="absolute top-4 right-4 flex gap-2">
                  <motion.button 
                    onClick={() => handleFavorite(user._id)}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className="p-2 rounded-full bg-white/80 shadow-md hover:shadow-lg transition-all duration-300"
                  >
                    {favorites.includes(user._id) ? 
                      <FaStar className="text-yellow-400 text-lg" /> : 
                      <FaRegStar className="text-gray-400 text-lg hover:text-yellow-400 transition-colors" />
                    }
                  </motion.button>
                  <motion.button 
                    onClick={() => handleBlock(user._id)}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className="p-2 rounded-full bg-white/80 shadow-md hover:shadow-lg transition-all duration-300"
                  >
                    <FaBan className="text-red-400 text-lg" />
                  </motion.button>
                </div>
                
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white text-xl font-bold shadow-lg">
                    {user.name.split(' ').map(word => word[0]).join('')}
                  </div>
                  <div className="flex-1">
                    <h2 className="text-xl font-bold text-gray-800">{user.name}</h2>
                    <p className="text-gray-600">{user.university}</p>
                    <div className="flex gap-1 mt-2">
                      {user.badges?.map(badge => (
                        <span key={badge} className="bg-gradient-to-r from-yellow-400 to-orange-400 text-white px-2 py-1 rounded-full text-xs flex items-center gap-1 shadow-md">
                          <FaAward />{badge}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                
                <p className="text-gray-700 mb-3 leading-relaxed">{user.bio}</p>
                
                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-gray-600">
                    <FaMapMarkerAlt className="text-blue-500" />
                    <span>{user.location || 'Location not specified'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <FaGraduationCap className="text-blue-500" />
                    <span>{user.subjects?.map(s => s.name).join(', ') || 'No subjects specified'}</span>
              </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <FaClock className="text-blue-500" />
                    <span>{user.availability?.join(', ') || 'No availability specified'}</span>
                  </div>
                </div>
                
                <div className="text-gray-600 mb-3">
                  <span className="font-semibold">Skills:</span> {user.skills?.join(', ') || 'No skills specified'}
                </div>
                
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-gray-700">Match Score</span>
                    <span className="text-lg font-bold bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
                      {user.matchPercentage}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${user.matchPercentage}%` }}
                    ></div>
                </div>
              </div>
                
                <div className="bg-blue-50/50 rounded-lg p-3 text-xs text-gray-600 mb-4">
                  <div className="font-semibold mb-1">Match Breakdown:</div>
                {user.matchBreakdown ? user.matchBreakdown.map((reason, i) => <div key={i}>• {reason}</div>) : <div>—</div>}
              </div>
                
              {user.connectionStatus === 'pending' ? (
                  <p className="text-yellow-600 font-semibold">Request Pending</p>
              ) : user.connectionStatus === 'accepted' ? (
                  <p className="text-green-600 font-semibold">Connected</p>
              ) : (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleConnect(user._id)}
                    className="w-full bg-gradient-to-r from-blue-500 to-purple-500 text-white py-3 px-6 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  Connect
                </motion.button>
              )}
            </motion.div>
          );
        })}
        </div>
      </div>
    </motion.div>
  );
};

export default Search;