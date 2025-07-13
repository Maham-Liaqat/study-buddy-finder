import React, { useContext } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext'; // Import AuthContext
import { useToast } from '../components/ToastContext';

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { token, logout } = useContext(AuthContext); // Use AuthContext
  const { addToast } = useToast();

  const handleLogout = () => {
    logout(); // Use the logout function from AuthContext
    addToast('Logged out successfully!', 'success');
    navigate('/login', { replace: true });
  };

  const scrollToSection = (sectionId) => {
    if (location.pathname !== '/') {
      navigate('/', { state: { scrollTo: sectionId } });
    } else {
      const section = document.getElementById(sectionId);
      if (section) {
        section.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  return (
    <nav className="fixed top-0 left-0 w-full z-50" style={{ background: 'rgba(255, 255, 255, 0.28)', backdropFilter: 'blur(12px)', boxShadow: '0 2px 12px rgba(126,166,247,0.10)', fontFamily: 'Inter, Segoe UI, Roboto, Arial, sans-serif' }}>
      <div className="container mx-auto flex flex-wrap justify-between items-center py-3 px-4">
        <Link to="/" className="text-2xl font-extrabold text-blue-700">
          <img src="/logo.svg" alt="Study Buddy Finder Logo" className="logo" style={{height: '40px'}}/>
        </Link>
        <button className="block md:hidden text-blue-700 focus:outline-none" aria-label="Toggle navigation">
          {/* Hamburger icon for mobile, to be implemented */}
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
        </button>
        <div className="hidden md:flex space-x-4 items-center">
          {token ? (
            <>
              <Link to="/dashboard" className="text-blue-700 text-lg font-semibold hover:underline">
                Dashboard
              </Link>
              <Link to="/profile" className="text-blue-700 text-lg font-semibold hover:underline">
                Profile
              </Link>
              <Link to="/search" className="text-blue-700 text-lg font-semibold hover:underline">
                Search
              </Link>
              <Link to="/matches" className="text-blue-700 text-lg font-semibold hover:underline">
                Matches
              </Link>
              <Link to="/requests" className="text-blue-700 text-lg font-semibold hover:underline">
                Requests
              </Link>
              <Link to="/chat" className="text-blue-700 text-lg font-semibold hover:underline">
                Chat
              </Link>
              <Link to="/notifications" className="text-blue-700 text-lg font-semibold hover:underline">
                Notifications
              </Link>
              <Link to="/sessions" className="text-blue-700 text-lg font-semibold hover:underline">
                Sessions
              </Link>
              <button
                onClick={handleLogout}
                className="bg-blue-500 text-white text-lg font-bold px-4 py-2 rounded-lg hover:bg-blue-600 transition"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => scrollToSection('about')}
                className="text-blue-700 text-lg font-semibold hover:underline"
              >
                About
              </button>
              <button
                onClick={() => scrollToSection('testimonials')}
                className="text-blue-700 text-lg font-semibold hover:underline"
              >
                Testimonials
              </button>
              <Link to="/login" className="text-blue-700 text-lg font-semibold hover:underline">
                Login
              </Link>
              <Link to="/signup" className="text-blue-700 text-lg font-semibold hover:underline">
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