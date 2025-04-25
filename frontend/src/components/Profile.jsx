import React, { useState, useEffect } from 'react';
import axios from '../axios';
import { jwtDecode } from 'jwt-decode';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../components/ToastContext';
import { motion } from 'framer-motion';

const BACKEND_URL = 'http://localhost:5001';

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
  const [avatarFile, setAvatarFile] = useState(null);
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
      const avatarFilename = res.data.avatar;
      const avatarUrl = avatarFilename && typeof avatarFilename === 'string'
        ? `${BACKEND_URL}/uploads/avatars/${avatarFilename}?t=${Date.now()}`
        : 'https://via.placeholder.com/40?text=User';
      console.log('Fetched avatar URL:', avatarUrl);
      setFormData({
        name: res.data.name || '',
        university: res.data.university || '',
        bio: res.data.bio || '',
        location: res.data.location || '',
        subjects: res.data.subjects || [],
        availability: res.data.availability || [],
        avatar: avatarUrl,
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

  const handleAvatarChange = (e) => {
    setAvatarFile(e.target.files[0]);
  };

  const handleAvatarUpload = async (e) => {
    e.preventDefault();
    if (!avatarFile) {
      addToast('Please select an image to upload.', 'error');
      return;
    }

    const uploadData = new FormData();
    uploadData.append('avatar', avatarFile);
    console.log('Uploading avatar file:', avatarFile.name);

    try {
      const res = await axios.post('/api/users/avatar', uploadData);
      console.log('Avatar upload response:', res.data);
      const avatarFilename = res.data.avatar;
      const newAvatarUrl = avatarFilename && typeof avatarFilename === 'string'
        ? `${BACKEND_URL}/uploads/avatars/${avatarFilename}?t=${Date.now()}`
        : 'https://via.placeholder.com/40?text=User';
      console.log('New avatar URL after upload:', newAvatarUrl);
      setFormData((prev) => ({ ...prev, avatar: newAvatarUrl }));
      addToast(res.data.message, 'success');
      await fetchUser();
    } catch (err) {
      if (err.response?.status === 401) {
        localStorage.removeItem('token');
        setError('Session expired. Redirecting to login...');
        addToast('Session expired. Redirecting to login...', 'error');
        setTimeout(() => navigate('/login'), 3000);
      } else {
        const errorMessage = err.response?.data?.error || 'Failed to upload avatar.';
        addToast(errorMessage, 'error');
        console.error('Avatar upload error:', err.message, err.response?.data);
      }
    }
  };

  const handleAvatarError = (e) => {
    console.error('Avatar failed to load, reverting to placeholder:', formData.avatar);
    e.target.src = 'https://via.placeholder.com/40?text=User';
    e.target.onerror = null;
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

  if (loading) return <div className="container mx-auto p-6 min-h-screen bg-gray-100"><p className="text-lg text-gray-900">Loading profile...</p></div>;
  if (error && !formData.name) return <div className="container mx-auto p-6 min-h-screen bg-gray-100"><p className="text-red-400 text-lg">{error}</p></div>;

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="container mx-auto p-6 min-h-screen bg-gray-100"
    >
      <div className="bg-gray-900 text-white p-8 rounded-xl shadow-lg max-w-2xl mx-auto">
        <motion.h1
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="text-4xl font-bold mb-6"
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
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="flex flex-col items-center mb-6"
        >
          <img
            src={formData.avatar}
            alt="User avatar"
            className="w-24 h-24 rounded-full mb-4"
            onError={handleAvatarError}
          />
          <form onSubmit={handleAvatarUpload} className="flex flex-col items-center">
            <input
              type="file"
              accept="image/jpeg,image/jpg,image/png"
              onChange={handleAvatarChange}
              className="mb-4 text-lg text-white"
            />
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              type="submit"
              className="px-4 py-2 bg-teal-500 text-white text-lg rounded-lg hover:bg-teal-600 transition"
            >
              Upload Avatar
            </motion.button>
          </form>
        </motion.div>
        <div className="flex flex-col gap-4">
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
              className="p-3 bg-gray-700 text-white text-lg border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 w-full"
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
              className="p-3 bg-gray-700 text-white text-lg border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 w-full"
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
              className="p-3 bg-gray-700 text-white text-lg border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 w-full"
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
              placeholder="Location (e.g., New York)"
              className="p-3 bg-gray-700 text-white text-lg border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 w-full"
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
              placeholder="Add Subject (e.g., Calculus)"
              className="flex-1 p-3 bg-gray-700 text-white text-lg border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleAddSubject}
              className="px-4 py-3 bg-teal-500 text-white text-lg rounded-lg hover:bg-teal-600 transition"
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
            {formData.subjects.map((subject, index) => (
              <span
                key={index}
                className="bg-gray-600 text-white text-lg px-3 py-1 rounded-lg flex items-center"
              >
                {subject.name}
                <button
                  onClick={() => handleRemoveSubject(index)}
                  className="ml-2 text-red-400"
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
            className="px-6 py-3 bg-teal-500 text-white text-lg rounded-lg hover:bg-teal-600 transition"
          >
            Save Profile
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
};

export default Profile;