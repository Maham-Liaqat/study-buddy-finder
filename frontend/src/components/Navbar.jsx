import React, { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext'; // Import AuthContext
import { useToast } from '../components/ToastContext';

const Navbar = () => {
  const navigate = useNavigate();
  const { token, logout } = useContext(AuthContext); // Use AuthContext
  const { addToast } = useToast();

  const handleLogout = () => {
    logout(); // Use the logout function from AuthContext
    addToast('Logged out successfully!', 'success');
    navigate('/login', { replace: true });
  };

  return (
    <nav className="bg-gray-900 text-white p-4 shadow-md">
      <div className="container mx-auto flex justify-between items-center">
        <Link to="/" className="text-2xl font-bold">
          Study Buddy Finder
        </Link>
        <div className="flex space-x-4">
          {token ? (
            <>
              <Link to="/dashboard" className="text-teal-300 text-lg hover:underline">
                Dashboard
              </Link>
              <Link to="/profile" className="text-teal-300 text-lg hover:underline">
                Profile
              </Link>
              <Link to="/search" className="text-teal-300 text-lg hover:underline">
                Search
              </Link>
              <Link to="/matches" className="text-teal-300 text-lg hover:underline">
                Matches
              </Link>
              <Link to="/chat" className="text-teal-300 text-lg hover:underline">
                Chat
              </Link>
              <Link to="/notifications" className="text-teal-300 text-lg hover:underline">
                Notifications
              </Link>
              <button
                onClick={handleLogout}
                className="bg-teal-500 text-white text-lg px-4 py-2 rounded-lg hover:bg-teal-600 transition"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="text-teal-300 text-lg hover:underline">
                Login
              </Link>
              <Link to="/signup" className="text-teal-300 text-lg hover:underline">
                Sign Up
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;