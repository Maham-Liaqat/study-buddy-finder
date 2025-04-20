import { useState, useEffect } from 'react';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';

const Profile = () => {
  const [formData, setFormData] = useState({
    name: '',
    university: '',
    bio: '',
    location: '',
    subjects: [],
    availability: [],
  });
  const [newSubject, setNewSubject] = useState('');
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
        setFormData({
          name: res.data.name,
          university: res.data.university,
          bio: res.data.bio || '',
          location: res.data.location || '',
          subjects: res.data.subjects || [],
          availability: res.data.availability || [],
        });
      } catch (err) {
        setError('Failed to fetch profile.');
        console.error(err);
      }
    };
    fetchUser();
  }, [userId, token]);

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
      await axios.patch(
        'http://localhost:5000/api/users/me',
        {
          name: formData.name,
          university: formData.university,
          bio: formData.bio,
          location: formData.location,
          subjects: formData.subjects,
          availability: formData.availability,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert('Profile updated successfully!');
    } catch (err) {
      setError('Failed to update profile.');
      console.error(err);
    }
  };

  return (
    <div className="container mx-auto p-6 min-h-screen bg-gray-100">
      <div className="bg-black text-white p-8 rounded-xl shadow-lg max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">My Profile</h1>
        {error && <p className="text-red-500 mb-4">{error}</p>}
        <div className="flex flex-col gap-4">
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Full Name"
            className="p-3 bg-gray-800 text-white border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500"
          />
          <input
            type="text"
            name="university"
            value={formData.university}
            onChange={handleChange}
            placeholder="University"
            className="p-3 bg-gray-800 text-white border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500"
          />
          <textarea
            name="bio"
            value={formData.bio}
            onChange={handleChange}
            placeholder="Bio"
            className="p-3 bg-gray-800 text-white border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500"
            rows="4"
          />
          <input
            type="text"
            name="location"
            value={formData.location}
            onChange={handleChange}
            placeholder="Location (e.g., New York)"
            className="p-3 bg-gray-800 text-white border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500"
          />
          <div className="flex gap-2">
            <input
              type="text"
              value={newSubject}
              onChange={(e) => setNewSubject(e.target.value)}
              placeholder="Add Subject (e.g., Calculus)"
              className="flex-1 p-3 bg-gray-800 text-white border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500"
            />
            <button
              onClick={handleAddSubject}
              className="px-4 py-3 bg-white text-black rounded-lg hover:bg-gray-200 transition"
            >
              Add
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {formData.subjects.map((subject, index) => (
              <span
                key={index}
                className="bg-gray-600 text-white px-3 py-1 rounded-lg flex items-center"
              >
                {subject.name}
                <button
                  onClick={() => handleRemoveSubject(index)}
                  className="ml-2 text-red-500"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
          <div>
            <p className="font-semibold mb-2">Availability</p>
            {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].map((day) => (
              <label key={day} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.availability.includes(day)}
                  onChange={() => handleAvailabilityChange(day)}
                  className="form-checkbox"
                />
                {day}
              </label>
            ))}
          </div>
          <button
            onClick={handleSubmit}
            className="px-6 py-3 bg-white text-black rounded-lg hover:bg-gray-200 transition"
          >
            Save Profile
          </button>
        </div>
      </div>
    </div>
  );
};

export default Profile;