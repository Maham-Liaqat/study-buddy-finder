import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from '../axios';
import { motion } from 'framer-motion';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setError('');
      setMessage('');
      const res = await axios.post('/api/users/forgot-password', { email });
      setMessage(res.data.message || 'Password reset email sent! Check your inbox.');
      setTimeout(() => navigate('/login'), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to send reset email.');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="container mx-auto p-6 flex justify-center items-center min-h-screen"
    >
      <div className="bg-gray-900 text-white p-8 rounded-xl shadow-lg max-w-md w-full">
        <motion.h1
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="text-4xl font-bold mb-6"
        >
          Forgot Password
        </motion.h1>
        {error && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-red-400 text-lg mb-4"
          >
            {error}
          </motion.p>
        )}
        {message && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-teal-300 text-lg mb-4"
          >
            {message}
          </motion.p>
        )}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <motion.div
            initial={{ x: -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              className="p-3 bg-gray-700 text-white text-lg border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 w-full"
              required
            />
          </motion.div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            type="submit"
            className="px-6 py-3 bg-teal-500 text-white text-lg rounded-lg hover:bg-teal-600 transition"
          >
            Send Reset Link
          </motion.button>
        </form>
        <p className="mt-4 text-center text-lg">
          <Link to="/login" className="text-teal-300 hover:underline">Back to Login</Link>
        </p>
      </div>
    </motion.div>
  );
};

export default ForgotPassword;