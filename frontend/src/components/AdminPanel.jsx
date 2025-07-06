import React, { useState, useEffect } from 'react';
import axios from '../axios';
import config from '../config';

const AdminPanel = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/admin/users');
      setUsers(response.data.users);
      setMessage(`Found ${response.data.count} users`);
    } catch (error) {
      setMessage('Error fetching users: ' + error.message);
    }
    setLoading(false);
  };

  const deleteAllUsers = async () => {
    if (!window.confirm('Are you sure you want to delete ALL users? This cannot be undone!')) {
      return;
    }
    
    setLoading(true);
    try {
      const response = await axios.delete('/api/admin/users');
      setMessage(response.data.message);
      setUsers([]);
    } catch (error) {
      setMessage('Error deleting users: ' + error.message);
    }
    setLoading(false);
  };

  const clearAllData = async () => {
    if (!window.confirm('Are you sure you want to clear ALL data? This cannot be undone!')) {
      return;
    }
    
    setLoading(true);
    try {
      const response = await axios.delete('/api/admin/all');
      setMessage(response.data.message);
      setUsers([]);
    } catch (error) {
      setMessage('Error clearing data: ' + error.message);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-6">Admin Panel</h1>
          
          {message && (
            <div className={`p-4 mb-4 rounded-lg ${
              message.includes('Error') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
            }`}>
              {message}
            </div>
          )}

          <div className="flex gap-4 mb-6">
            <button
              onClick={fetchUsers}
              disabled={loading}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
            >
              {loading ? 'Loading...' : 'Refresh Users'}
            </button>
            
            <button
              onClick={deleteAllUsers}
              disabled={loading}
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50"
            >
              {loading ? 'Deleting...' : 'Delete All Users'}
            </button>
            
            <button
              onClick={clearAllData}
              disabled={loading}
              className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600 disabled:opacity-50"
            >
              {loading ? 'Clearing...' : 'Clear All Data'}
            </button>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <h2 className="text-xl font-semibold mb-4">Users ({users.length})</h2>
            {users.length === 0 ? (
              <p className="text-gray-500">No users found</p>
            ) : (
              <div className="space-y-2">
                {users.map((user) => (
                  <div key={user._id} className="bg-white p-3 rounded border">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-medium">{user.name}</p>
                        <p className="text-sm text-gray-600">{user.email}</p>
                        <p className="text-xs text-gray-500">{user.university}</p>
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel; 