import React, { useState } from 'react';
import axios from '../axios';
import { useNavigate, Link } from 'react-router-dom';
import Error from '../components/Error';
import { useToast } from '../components/ToastContext';
import { motion } from 'framer-motion';

const SignUp = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    university: '',
  });
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { addToast } = useToast();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setError('');
      const res = await axios.post('/api/users/signup', formData);
      localStorage.setItem('token', res.data.token);
      addToast('You have successfully signed up!', 'success');
      setTimeout(() => navigate('/profile'), 1000);
    } catch (err) {
      const errorMessage = err.response?.data?.error || 'Failed to sign up.';
      setError(errorMessage);
      addToast(errorMessage, 'error');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="container mx-auto p-6 flex justify-center items-center min-h-screen bg-gradient-to-br from-blue-50 via-white to-lavender-100"
    >
      <div className="bg-white text-blue-900 p-8 rounded-2xl shadow-2xl max-w-md w-full border border-blue-100" style={{ fontFamily: 'Inter, Segoe UI, Roboto, Arial, sans-serif' }}>
        <motion.h1
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="text-4xl font-extrabold mb-6 text-blue-700"
        >
          Sign Up
        </motion.h1>
        {error && <Error message={error} />}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <motion.div
            initial={{ x: -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Full Name"
              className="p-3 bg-blue-50 text-blue-900 text-lg border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300 w-full"
              required
            />
          </motion.div>
          <motion.div
            initial={{ x: 50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.5 }}
          >
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Email"
              className="p-3 bg-blue-50 text-blue-900 text-lg border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300 w-full"
              required
            />
          </motion.div>
          <motion.div
            initial={{ x: -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.5 }}
          >
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Password"
              className="p-3 bg-blue-50 text-blue-900 text-lg border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300 w-full"
              required
            />
          </motion.div>
          <motion.div
            initial={{ x: 50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.5 }}
          >
            <input
              type="text"
              name="university"
              value={formData.university}
              onChange={handleChange}
              placeholder="University"
              className="p-3 bg-blue-50 text-blue-900 text-lg border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300 w-full"
              required
            />
          </motion.div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            type="submit"
            className="px-6 py-3 bg-gradient-to-r from-blue-400 to-purple-400 text-white text-lg font-bold rounded-lg hover:from-blue-500 hover:to-purple-500 transition"
          >
            Sign Up
          </motion.button>
        </form>
        <p className="mt-4 text-center text-lg text-blue-400">
          Already have an account?{' '}
          <Link to="/login" className="text-purple-500 hover:underline font-semibold">Login</Link>
        </p>
      </div>
    </motion.div>
  );
};

export default SignUp;