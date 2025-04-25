import React, { useState } from 'react';
import axios from '../axios';
import { useToast } from './ToastContext';

const ConnectModal = ({ recipientId, recipientName, onClose }) => {
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const token = localStorage.getItem('token');
  const { addToast } = useToast();

  // Validate props
  if (!recipientId || !recipientName) {
    console.error('Invalid props in ConnectModal:', { recipientId, recipientName });
    return null; // Don't render if props are invalid
  }

  const handleSendRequest = async () => {
    if (!token) {
      setError('Please log in to send a request.');
      addToast('Please log in to send a request.', 'error');
      return;
    }

    try {
      setError('');
      const response = await axios.post(
        '/api/requests',
        { recipientId, message },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      console.log('Request sent:', response.data);
      addToast('Request sent successfully!', 'success');
      onClose(); // Close modal immediately after success
    } catch (err) {
      console.error('Send request error:', err.message, err.response?.data);
      const errorMsg = err.response?.data?.error || 'Failed to send request.';
      setError(
        errorMsg === 'Request already sent'
          ? 'You’ve already sent a request to this user. Check your pending requests.'
          : errorMsg
      );
      addToast(errorMsg, 'error');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-900 text-white p-6 rounded-lg shadow-lg max-w-sm w-full">
        <h2 className="text-xl font-semibold mb-4">Connect with {recipientName}</h2>
        {error && <p className="text-red-500 mb-4">{error}</p>}
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Add a message..."
          className="w-full p-3 bg-gray-800 text-white border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 mb-4"
          rows="3"
        />
        <div className="flex justify-end space-x-2">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSendRequest}
            className="px-4 py-2 rounded-lg transition bg-white text-black hover:bg-gray-200"
          >
            Send Request
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConnectModal;