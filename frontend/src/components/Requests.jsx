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

  if (loading) return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-lg text-gray-700">Loading requests...</p>
      </div>
    </div>
  );
  
  if (error) return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
      <div className="text-center">
        <p className="text-red-500 text-lg">{error}</p>
      </div>
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50"
    >
      <div className="container mx-auto mt-20 p-6">
        <div className="bg-white/80 backdrop-blur-sm border border-blue-200/50 p-8 rounded-2xl shadow-xl max-w-2xl mx-auto">
        <motion.h1
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
            className="text-4xl font-bold mb-6 text-center bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"
        >
            Connection Requests
        </motion.h1>
        {requests.length === 0 ? (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
              className="text-lg text-gray-600 text-center"
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
                    className="p-6 bg-white/60 backdrop-blur-sm border border-blue-200/30 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                >
                    <p className="text-lg text-gray-800">
                    <strong>{request.isSent ? 'Sent to' : 'Received from'}:</strong>{' '}
                      <span className="text-blue-600 font-semibold">{request.isSent ? request.recipientName : request.senderName}</span>
                  </p>
                  {request.message && (
                      <p className="text-lg text-gray-700"><strong>Message:</strong> {request.message}</p>
                    )}
                    <p className="text-lg text-gray-700">
                      <strong>Status:</strong> 
                      <span className={`ml-2 px-3 py-1 rounded-full text-sm font-medium ${
                        request.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        request.status === 'accepted' ? 'bg-green-100 text-green-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {request.status}
                      </span>
                    </p>
                    <p className="text-lg text-gray-600"><strong>Date:</strong> {new Date(request.createdAt).toLocaleString()}</p>
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
                          className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white text-lg rounded-xl hover:shadow-lg transition-all duration-300 font-semibold"
                      >
                        Accept
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleReject(request._id)}
                          className="px-6 py-3 bg-gradient-to-r from-red-500 to-pink-500 text-white text-lg rounded-xl hover:shadow-lg transition-all duration-300 font-semibold"
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
      </div>
    </motion.div>
  );
};

export default Requests;