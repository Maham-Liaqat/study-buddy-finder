import React, { useState, useEffect, useContext } from 'react';
import axios from '../axios';
import { useNavigate, Link } from 'react-router-dom';
import { useToast } from '../components/ToastContext';
import { AuthContext } from '../context/AuthContext'; // Import AuthContext
import { motion } from 'framer-motion';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();
  const { addToast } = useToast();
  const { token, login } = useContext(AuthContext); // Use AuthContext

  // Redirect if already logged in
  useEffect(() => {
    if (token) {
      navigate('/dashboard', { replace: true });
    }
  }, [token, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('/api/users/login', { email, password });
      const { accessToken, token: resToken, refreshToken } = res.data;
      const authToken = accessToken || resToken; // Handle both accessToken and token
      login(authToken, refreshToken); // Use the login function from AuthContext
      addToast('Login successful! Welcome!', 'success');
      navigate('/dashboard', { replace: true });
    } catch (err) {
      const errorMessage = err.response?.data?.error || 'Login failed. Please try again.';
      addToast(errorMessage, 'error');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="flex items-center justify-center min-h-screen bg-gray-100"
    >
      <motion.div
        initial={{ scale: 0.95 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.3 }}
        className="bg-gray-800 text-white p-8 rounded-xl shadow-lg w-full max-w-md"
      >
        <h2 className="text-3xl font-bold mb-6 text-center">Login</h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-lg mb-2">
              Email
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-teal-500"
              placeholder="Enter your email"
              required
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-lg mb-2">
              Password
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-teal-500"
              placeholder="Enter your password"
              required
            />
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            type="submit"
            className="w-full p-3 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition"
          >
            Login
          </motion.button>
        </form>
        <div className="mt-6 text-center">
          <Link to="/forgot-password" className="text-teal-400 hover:underline">
            Forgot Password?
          </Link>
        </div>
        <div className="mt-2 text-center">
          <p className="text-gray-400">
            Don't have an account?{' '}
            <Link to="/signup" className="text-teal-400 hover:underline">
              Sign Up
            </Link>
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default Login;