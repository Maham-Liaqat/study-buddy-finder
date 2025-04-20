import { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const [error, setError] = useState('');
  const token = localStorage.getItem('token');
  const userId = token ? jwtDecode(token).userId : null;

  useEffect(() => {
    const fetchUser = async () => {
      if (!userId) {
        setError('Please log in.');
        return;
      }
      try {
        setError('');
        const res = await axios.get('http://localhost:5000/api/users/me', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUser(res.data);
      } catch (err) {
        setError('Failed to fetch user data.');
        console.error(err);
      }
    };
    fetchUser();
  }, [userId, token]);

  return (
    <div className="container mx-auto p-6 min-h-screen bg-gray-100">
      <div className="bg-black text-white p-8 rounded-xl shadow-lg max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">
          Welcome, {user ? user.name : 'User'}
        </h1>
        {error && <p className="text-red-500 mb-4">{error}</p>}
        <p className="text-gray-300 mb-6">
          Your dashboard to connect with study buddies!
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link
            to="/profile"
            className="bg-white text-black px-6 py-3 rounded-lg hover:bg-gray-200 transition text-center"
          >
            My Profile
          </Link>
          <Link
            to="/matches"
            className="bg-white text-black px-6 py-3 rounded-lg hover:bg-gray-200 transition text-center"
          >
            Find Study Buddies
          </Link>
          <Link
            to="/requests"
            className="bg-white text-black px-6 py-3 rounded-lg hover:bg-gray-200 transition text-center"
          >
            Connection Requests
          </Link>
          <Link
            to="/chat"
            className="bg-white text-black px-6 py-3 rounded-lg hover:bg-gray-200 transition text-center"
          >
            Messages
          </Link>
          <Link
            to="/notifications"
            className="bg-white text-black px-6 py-3 rounded-lg hover:bg-gray-200 transition text-center"
          >
            Notifications
          </Link>
          <Link
            to="/search"
            className="bg-white text-black px-6 py-3 rounded-lg hover:bg-gray-200 transition text-center"
          >
            Search
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;