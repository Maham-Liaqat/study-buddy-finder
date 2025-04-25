import React, { useState, useEffect } from 'react';
import axios from '../axios';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../components/ToastContext';
import { motion, AnimatePresence } from 'framer-motion';

const Requests = () => {
  const [requests, setRequests] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem('token');
  const navigate = useNavigate();
  const { addToast } = useToast();

  useEffect(() => {
    const fetchRequests = async () => {
      if (!token) {
        setError('Please log in.');
        setLoading(false);
        navigate('/login');
        return;
      }

      try {
        setError('');
        setLoading(true);
        const res = await axios.get('/api/requests', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setRequests(res.data);
      } catch (err) {
        if (err.response?.status === 401) {
          localStorage.removeItem('token');
          setError('Session expired. Redirecting to login...');
          setTimeout(() => navigate('/login'), 3000);
        } else {
          const errorMessage = err.response?.data?.error || 'Failed to fetch requests.';
          setError(errorMessage);
          addToast(errorMessage, 'error');
        }
        console.error('Fetch requests error:', err.message, err.response?.data);
      } finally {
        setLoading(false);
      }
    };
    fetchRequests();
  }, [token, navigate, addToast]);

  const handleAccept = async (requestId) => {
    try {
      setError('');
      const res = await axios.patch(`/api/requests/${requestId}/accept`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRequests(requests.map(req =>
        req._id === requestId ? { ...req, status: 'accepted' } : req
      ));
      addToast(res.data.message, 'success');
    } catch (err) {
      const errorMessage = err.response?.data?.error || 'Failed to accept request.';
      setError(errorMessage);
      addToast(errorMessage, 'error');
      console.error('Accept request error:', err.message, err.response?.data);
    }
  };

  const handleReject = async (requestId) => {
    try {
      setError('');
      const res = await axios.patch(`/api/requests/${requestId}/reject`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRequests(requests.map(req =>
        req._id === requestId ? { ...req, status: 'rejected' } : req
      ));
      addToast(res.data.message, 'success');
    } catch (err) {
      const errorMessage = err.response?.data?.error || 'Failed to reject request.';
      setError(errorMessage);
      addToast(errorMessage, 'error');
      console.error('Reject request error:', err.message, err.response?.data);
    }
  };

  if (loading) return <div className="container mx-auto p-6 min-h-screen bg-gray-100"><p className="text-lg text-gray-900">Loading requests...</p></div>;
  if (error) return <div className="container mx-auto p-6 min-h-screen bg-gray-100"><p className="text-red-400 text-lg">{error}</p></div>;

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
          Requests
        </motion.h1>
        {requests.length === 0 ? (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="text-lg"
          >
            No requests found.
          </motion.p>
        ) : (
          <div className="flex flex-col gap-4">
            <AnimatePresence>
              {requests.map((request, index) => (
                <motion.div
                  key={request._id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  className="p-4 bg-gray-700 rounded-lg"
                >
                  <p className="text-lg">
                    <strong>{request.isSent ? 'Sent to' : 'Received from'}:</strong>{' '}
                    {request.isSent ? request.recipientName : request.senderName}
                  </p>
                  {request.message && (
                    <p className="text-lg"><strong>Message:</strong> {request.message}</p>
                  )}
                  <p className="text-lg"><strong>Status:</strong> {request.status}</p>
                  <p className="text-lg"><strong>Date:</strong> {new Date(request.createdAt).toLocaleString()}</p>
                  {!request.isSent && request.status === 'pending' && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.4 + index * 0.1, duration: 0.5 }}
                      className="flex gap-2 mt-2"
                    >
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleAccept(request._id)}
                        className="px-4 py-2 bg-teal-500 text-white text-lg rounded-lg hover:bg-teal-600 transition"
                      >
                        Accept
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleReject(request._id)}
                        className="px-4 py-2 bg-red-500 text-white text-lg rounded-lg hover:bg-red-600 transition"
                      >
                        Reject
                      </motion.button>
                    </motion.div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default Requests;