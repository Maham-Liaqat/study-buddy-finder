import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const Home = () => {
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1 }}
      className="min-h-screen bg-gray-100 flex flex-col items-center justify-center text-center p-6"
    >
      <motion.h1
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        className="text-5xl font-bold text-gray-900 mb-4"
      >
        Welcome to Study Buddy Finder
      </motion.h1>
      <motion.p
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.5 }}
        className="text-lg text-gray-700 mb-8 max-w-md"
      >
        Connect with study partners who share your interests and availability. Find the perfect buddy to ace your studies!
      </motion.p>
      <div className="flex gap-4">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate('/login')}
          className="px-6 py-3 bg-teal-500 text-white text-lg rounded-lg hover:bg-teal-600 transition"
        >
          Login
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate('/signup')}
          className="px-6 py-3 bg-gray-900 text-white text-lg rounded-lg hover:bg-gray-800 transition"
        >
          Get Started
        </motion.button>
      </div>
    </motion.div>
  );
};

export default Home;