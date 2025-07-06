import React, { useState, useEffect } from 'react';
import axios from '../axios';
import { jwtDecode } from 'jwt-decode';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../components/ToastContext';
import { motion } from 'framer-motion';

const Profile = () => {
  const [formData, setFormData] = useState({
    name: '',
    university: '',
    bio: '',
    location: '',
    subjects: [],
    availability: [],
    avatar: '',
  });
  const [newSubject, setNewSubject] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem('token');
  const userId = token ? jwtDecode(token).userId : null;
  const navigate = useNavigate();
  const { addToast } = useToast();

  const fetchUser = async () => {
    if (!userId || !token) {
      setError('Please log in.');
      setLoading(false);
      navigate('/login');
      return;
    }

    try {
      setError('');
      setLoading(true);
      const res = await axios.get('/api/users/me');
      console.log('User data from /api/users/me:', res.data);
      setFormData({
        name: res.data.name || '',
        university: res.data.university || '',
        bio: res.data.bio || '',
        location: res.data.location || '',
        subjects: res.data.subjects || [],
        availability: res.data.availability || [],
        avatar: res.data.avatar || '',
      });
    } catch (err) {
      if (err.response?.status === 401) {
        localStorage.removeItem('token');
        setError('Session expired. Redirecting to login...');
        addToast('Session expired. Redirecting to login...', 'error');
        setTimeout(() => navigate('/login'), 3000);
      } else if (err.response?.status === 500) {
        setError('Server error: Unable to fetch profile. Please try again later.');
      } else {
        const errorMessage = err.response?.data?.error || 'Failed to fetch profile.';
        setError(errorMessage);
        addToast(errorMessage, 'error');
      }
      console.error('Fetch profile error:', err.message, err.response?.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log('Token in localStorage:', token);
    console.log('Decoded userId:', userId);
    fetchUser();
  }, [userId, token, navigate, addToast]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleAddSubject = () => {
    if (newSubject.trim()) {
      setFormData({
        ...formData,
        subjects: [...formData.subjects, { name: newSubject }],
      });
      setNewSubject('');
    }
  };

  const handleRemoveSubject = (index) => {
    setFormData({
      ...formData,
      subjects: formData.subjects.filter((_, i) => i !== index),
    });
  };

  const handleAvailabilityChange = (day) => {
    setFormData({
      ...formData,
      availability: formData.availability.includes(day)
        ? formData.availability.filter((d) => d !== day)
        : [...formData.availability, day],
    });
  };

  const handleSubmit = async () => {
    try {
      setError('');
      
      const res = await axios.patch('/api/users/me', {
        name: formData.name,
        university: formData.university,
        bio: formData.bio,
        location: formData.location,
        subjects: formData.subjects,
        availability: formData.availability,
      });          
      console.log('Profile update response:', res.data);
      const successMessage = res.data.message || 'Profile updated successfully!';
      addToast(successMessage, 'success');
    } catch (err) {     
      if (err.response?.status === 401) {
        localStorage.removeItem('token'); 
        setError('Session expired. Redirecting to login...');
        addToast('Session expired. Redirecting to login...', 'error');
        setTimeout(() => navigate('/login'), 3000);
      } else if (err.response?.status === 500) {
        setError('Server error: Unable to update profile. Please try again later.');
      } else {
        const errorMessage = err.response?.data?.error || 'Failed to update user.';
        setError(errorMessage);
        addToast(errorMessage, 'error');
      }
      console.error('Update profile error:', err.message, err.response?.data);
    }
  };

  if (loading) return <div className="container mx-auto p-6 min-h-screen bg-gradient-to-br from-blue-50 via-white to-lavender-100"><p className="text-lg text-blue-900">Loading profile...</p></div>;
  if (error && !formData.name) return <div className="container mx-auto p-6 min-h-screen bg-gradient-to-br from-blue-50 via-white to-lavender-100"><p className="text-red-400 text-lg">{error}</p></div>;

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="container mx-auto mt-20 p-10 min-h-screen bg-gradient-to-br from-blue-50 via-white to-lavender-100"
    >
      <div className="bg-white text-blue-900 p-8 rounded-2xl shadow-2xl max-w-2xl mx-auto border border-blue-100">
        <motion.h1
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="text-4xl font-extrabold mb-6 text-blue-700"
        >
          My Profile
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
        <div className="flex flex-col gap-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="flex flex-col items-center gap-2"
          >
          </motion.div>
          <motion.div
            initial={{ x: -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.5 }}
          >
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Full Name"
              className="p-3 bg-blue-50 text-blue-900 text-lg border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300 w-full"
            />
          </motion.div>
          <motion.div
            initial={{ x: 50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.5 }}
          >
            <input
              type="text"
              name="university"
              value={formData.university}
              onChange={handleChange}
              placeholder="University"
              className="p-3 bg-blue-50 text-blue-900 text-lg border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300 w-full"
            />
          </motion.div>
          <motion.div
            initial={{ x: -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.5 }}
          >
            <textarea
              name="bio"
              value={formData.bio}
              onChange={handleChange}
              placeholder="Bio"
              className="p-3 bg-blue-50 text-blue-900 text-lg border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300 w-full"
              rows="4"
            />
          </motion.div>
          <motion.div
            initial={{ x: 50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 1.0, duration: 0.5 }}
          >
            <input
              type="text"
              name="location"
              value={formData.location}
              onChange={handleChange}
              placeholder="Location"
              className="p-3 bg-blue-50 text-blue-900 text-lg border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300 w-full"
            />
          </motion.div>
          <motion.div
            initial={{ x: -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.8, duration: 0.5 }}
            className="flex gap-2"
          >
            <input
              type="text"
              value={newSubject}
              onChange={(e) => setNewSubject(e.target.value)}
              placeholder="Add Subject"
              className="p-3 bg-blue-50 text-blue-900 text-lg border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300 w-full"
            />
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleAddSubject}
              className="px-4 py-2 bg-gradient-to-r from-blue-400 to-purple-400 text-white font-bold rounded-lg hover:from-blue-500 hover:to-purple-500 transition"
              type="button"
            >
              Add
            </motion.button>
          </motion.div>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9, duration: 0.5 }}
            className="flex flex-wrap gap-2"
          >
            {formData.subjects.map((subject, idx) => (
              <span key={idx} className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm flex items-center">
                {subject.name}
                <button
                  onClick={() => handleRemoveSubject(idx)}
                  className="ml-2 text-blue-400 hover:text-red-400 font-bold"
                  type="button"
                >
                  ×
                </button>
              </span>
            ))}
          </motion.div>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.0, duration: 0.5 }}
          >
            <p className="font-semibold mb-2 text-lg">Availability</p>
            {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => (
              <label key={day} className="flex items-center gap-2 text-lg">
                <input
                  type="checkbox"
                  checked={formData.availability.includes(day)}
                  onChange={() => handleAvailabilityChange(day)}
                  className="form-checkbox h-5 w-5 text-teal-500"
                />
                {day}
              </label>
            ))}
          </motion.div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleSubmit}
            className="mt-4 px-6 py-3 bg-gradient-to-r from-blue-400 to-purple-400 text-white font-bold rounded-lg hover:from-blue-500 hover:to-purple-500 transition"
          >
            Save
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
};

export default Profile;