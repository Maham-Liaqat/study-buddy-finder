import React, { useState, useEffect } from 'react';
import axios from '../axios';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../components/ToastContext';
import { motion } from 'framer-motion';
import { FaUserFriends, FaUserPlus, FaBell, FaCalendarAlt, FaUserEdit, FaRegClock, FaMapMarkerAlt, FaUserCircle } from 'react-icons/fa';

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const token = localStorage.getItem('token');
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [matches, setMatches] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [profileCompletion, setProfileCompletion] = useState(0);
  const [upcomingSessions, setUpcomingSessions] = useState([]);

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

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [matchesRes, notificationsRes, suggestionsRes, upcomingSessionsRes] = await Promise.all([
          axios.get('/api/users/matches'),
          axios.get('/api/notifications'),
          axios.get('/api/users/search'),
          axios.get('/api/sessions/upcoming'),
        ]);
        setMatches(matchesRes.data);
        setNotifications(notificationsRes.data);
        // Top 3 suggestions by matchPercentage, excluding already matched/pending
        const myIds = new Set(matchesRes.data.map(m => m.id));
        const filtered = suggestionsRes.data.filter(s => !myIds.has(s._id));
        setSuggestions(filtered.sort((a, b) => b.matchPercentage - a.matchPercentage).slice(0, 3));
        setUpcomingSessions(upcomingSessionsRes.data);
        // Profile completion meter (simple version)
        if (user) {
          let filled = 0;
          if (user.name) filled++;
          if (user.university) filled++;
          if (user.bio) filled++;
          if (user.location) filled++;
          if (user.subjects && user.subjects.length > 0) filled++;
          if (user.availability && user.availability.length > 0) filled++;
          if (user.avatar) filled++;
          setProfileCompletion(Math.round((filled / 7) * 100));
        }
      } catch (err) {
        // Ignore errors for now
      }
    };
    if (user) fetchDashboardData();
  }, [user]);

  const handleNavigation = (path) => {
    navigate(path);
  };

  if (loading) return <div className="container mx-auto p-6 min-h-screen bg-gray-100"><p className="text-lg text-gray-900">Loading...</p></div>;
  if (error) return <div className="container mx-auto p-6 min-h-screen bg-gray-100"><p className="text-red-400 text-lg">{error}</p></div>;

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
      className="container mx-auto mt-30 p-6 min-h-screen bg-gradient-to-br from-blue-50 via-white to-lavender-100"
    >
      <h1 className="text-3xl font-bold mb-6 text-gray-900 flex items-center gap-4">
        {/* Replace <Avatar ... /> with fallback or remove */}
        Welcome, {user?.name}!
      </h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Quick Stats */}
        <div className="bg-white rounded-xl shadow-lg p-6 flex flex-col gap-4">
          <div className="flex items-center gap-2 text-lg font-semibold"><FaUserFriends className="text-teal-500" /> Matches: {matches.filter(m => m.connectionStatus === 'accepted').length}</div>
          <div className="flex items-center gap-2 text-lg font-semibold"><FaUserPlus className="text-yellow-500" /> Pending Requests: {matches.filter(m => m.connectionStatus === 'pending').length}</div>
          <div className="flex items-center gap-2 text-lg font-semibold"><FaBell className="text-blue-500" /> Notifications: {notifications.filter(n => !n.read).length}</div>
          <div className="flex items-center gap-2 text-lg font-semibold"><FaCalendarAlt className="text-purple-500" /> Upcoming Sessions: {upcomingSessions.length}</div>
        </div>
        {/* Profile Completion Meter */}
        <div className="bg-white rounded-xl shadow-lg p-6 flex flex-col items-center justify-center">
          <div className="text-lg font-semibold mb-2 flex items-center gap-2"><FaUserEdit className="text-teal-500" /> Profile Completion</div>
          <div className="w-full bg-gray-200 rounded-full h-4 mb-2">
            <div className="bg-teal-500 h-4 rounded-full" style={{ width: `${profileCompletion}%` }}></div>
          </div>
          <div className="text-sm text-gray-700">{profileCompletion}% complete</div>
        </div>
        {/* Shortcuts */}
        <div className="bg-white rounded-xl shadow-lg p-6 flex flex-col gap-4">
          <button onClick={() => handleNavigation('/profile')} className="px-4 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition">Edit Profile</button>
          <button onClick={() => handleNavigation('/search')} className="px-4 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition">Find Buddies</button>
          <button onClick={() => handleNavigation('/matches')} className="px-4 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition">My Connections</button>
          <button onClick={() => handleNavigation('/chat')} className="px-4 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition">Chat</button>
          <button onClick={() => handleNavigation('/sessions')} className="px-4 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition">Sessions</button>
          <button onClick={() => handleNavigation('/notifications')} className="px-4 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition">Notifications</button>
        </div>
      </div>
      {/* Suggestions */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
        <div className="text-xl font-bold mb-4 text-gray-900">Top Study Buddy Suggestions</div>
        <div className="flex flex-wrap gap-4">
          {suggestions.length === 0 && <div className="text-gray-500">No suggestions available.</div>}
          {suggestions.map(s => (
            <div key={s._id} className="bg-gray-100 rounded-lg p-4 flex flex-col items-start w-64">
              <div className="font-semibold text-lg mb-1">{s.name}</div>
              <div className="text-sm text-gray-700 mb-1">{s.university}</div>
              <div className="text-xs text-gray-600 mb-1">Subjects: {s.subjects?.map(sub => sub.name).join(', ')}</div>
              <div className="text-xs text-gray-600 mb-1">Location: {s.location}</div>
              <div className="text-xs text-gray-600 mb-1">Match: <span className="font-bold text-teal-600">{s.matchPercentage}%</span></div>
            </div>
          ))}
        </div>
      </div>
      {/* Recent Notifications */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
        <div className="text-xl font-bold mb-4 text-gray-900 flex items-center gap-2"><FaBell className="text-blue-500" /> Recent Activity & Notifications</div>
        <ul className="divide-y divide-gray-200">
          {notifications.length === 0 && <li className="text-gray-500">No notifications yet.</li>}
          {notifications.slice(0, 5).map(n => (
            <li key={n._id} className={`py-2 flex items-center gap-2 ${n.read ? 'text-gray-500' : 'text-gray-900 font-semibold'}`}>
              {n.type === 'session' ? <FaRegClock className="text-teal-500" /> : <FaBell className="text-blue-400" />}
              <span>{n.message}</span>
              <span className="text-xs text-gray-400 ml-auto">({new Date(n.createdAt).toLocaleString()})</span>
            </li>
          ))}
        </ul>
      </div>
      {/* Upcoming Sessions */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
        <div className="text-xl font-bold mb-4 text-gray-900 flex items-center gap-2"><FaRegClock className="text-teal-500" /> Upcoming Sessions (Next 24h)</div>
        {upcomingSessions.length === 0 ? (
          <div className="text-gray-500">No sessions scheduled in the next 24 hours.</div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {upcomingSessions.map(session => (
              <li key={session._id} className="py-3 flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <FaCalendarAlt className="text-purple-500" />
                    <span className="font-semibold text-lg">{session.title}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <FaRegClock className="text-gray-400" />
                    {new Date(session.startTime).toLocaleString()} - {new Date(session.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <FaMapMarkerAlt className="text-gray-400" />
                    {session.location || '—'}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    {session.participants.map(p => (
                      <span key={p._id || p} className="flex items-center gap-1 mr-2">
                        <span>{p.name}</span>
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2 mt-2 md:mt-0">
                  {/* Details button could link to calendar or open modal in future */}
                  <button className="px-3 py-1 bg-teal-500 text-white rounded hover:bg-teal-600 transition text-sm">Details</button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </motion.div>
  );
};

export default Dashboard;