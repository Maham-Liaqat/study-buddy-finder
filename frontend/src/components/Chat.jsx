import React, { useState, useEffect, useRef, useMemo } from 'react';
import axios from '../axios';
import { useNavigate, useParams } from 'react-router-dom';
import { io } from 'socket.io-client';
import { jwtDecode } from 'jwt-decode';
import { useToast } from '../components/ToastContext';
import { motion, AnimatePresence } from 'framer-motion';

const BACKEND_URL = 'http://localhost:5001';

const Chat = () => {
  const [matches, setMatches] = useState([]);
  const [unreadCounts, setUnreadCounts] = useState({});
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [error, setError] = useState('');
  const [loadingMatches, setLoadingMatches] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const token = localStorage.getItem('token');
  const navigate = useNavigate();
  const { recipientId } = useParams();
  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);
  const { addToast } = useToast();

  const decodedToken = useMemo(() => {
    try {
      return token ? jwtDecode(token) : null;
    } catch (err) {
      console.error('Invalid token:', err.message);
      return null;
    }
  }, [token]);

  const currentUserId = decodedToken?.userId;

  useEffect(() => {
    if (!token || !decodedToken) {
      setError('Please log in.');
      setLoadingMatches(false);
      navigate('/login');
      return;
    }

    const userId = decodedToken.userId;

    socketRef.current = io('http://localhost:5001', {
      query: { userId },
    });

    socketRef.current.on('connect', () => {
      console.log('Connected to Socket.IO server');
      socketRef.current.emit('join', userId);
    });

    socketRef.current.on('receiveMessage', ({ senderId, message }) => {
      if (selectedMatch && senderId === selectedMatch._id) {
        setMessages((prev) => [...prev, { senderId, message, createdAt: new Date() }]);
      } else {
        setUnreadCounts((prev) => ({
          ...prev,
          [senderId]: (prev[senderId]?.count || 0) + 1,
        }));
      }
    });

    return () => {
      socketRef.current.off('receiveMessage');
      socketRef.current.disconnect();
    };
  }, [token, navigate, selectedMatch, decodedToken]);

  useEffect(() => {
    const fetchMatches = async () => {
      if (!token) return;

      try {
        setError('');
        setLoadingMatches(true);
        console.log('Fetching matches and unread counts...');

        const timeoutPromise = (promise, timeout = 10000) =>
          Promise.race([
            promise,
            new Promise((_, reject) =>
              setTimeout(() => reject(new Error('Request timed out')), timeout)
            ),
          ]);

        let matchesData = [];
        let countsData = {};

        // Fetch matches
        try {
          const matchesRes = await timeoutPromise(
            axios.get('/api/users/matches', {
              headers: { Authorization: `Bearer ${token}` },
            })
          );
          console.log('Matches response:', matchesRes.data);
          matchesData = matchesRes.data;
          setMatches(matchesData);
        } catch (err) {
          console.error('Error fetching matches:', err.message, err.response?.data);
          if (err.response?.status === 401) {
            localStorage.removeItem('token');
            addToast('Session expired. Please log in again.', 'error');
            navigate('/login');
            return;
          }
          addToast('Failed to fetch matches. You can still select a match if available.', 'error');
        }

        // Fetch unread counts
        try {
          const unreadCountsRes = await timeoutPromise(
            axios.get('/api/messages/unread-counts', {
              headers: { Authorization: `Bearer ${token}` },
            })
          );
          console.log('Unread counts response:', unreadCountsRes.data);
          countsData = unreadCountsRes.data;
          setUnreadCounts(countsData);
        } catch (err) {
          console.error('Error fetching unread counts:', err.message, err.response?.data);
          if (err.response?.status === 401) {
            localStorage.removeItem('token');
            addToast('Session expired. Please log in again.', 'error');
            navigate('/login');
            return;
          }
          addToast('Failed to fetch unread message counts.', 'error');
        }

        if (recipientId) {
          const match = matchesData.find(match => match.id === recipientId);
          if (match) {
            // Align match object with expected structure
            const formattedMatch = {
              _id: match.id,
              name: match.name,
              avatar: match.avatar,
            };
            setSelectedMatch(formattedMatch);
            setUnreadCounts((prev) => ({ ...prev, [recipientId]: { count: 0 } }));
          } else {
            setError('Match not found.');
            addToast('Match not found.', 'error');
          }
        }
      } catch (err) {
        console.error('Unexpected error in fetchMatches:', err.message);
        if (err.message === 'Request timed out') {
          setError('Request timed out. Please check your connection and try again.');
          addToast('Request timed out. Please check your connection and try again.', 'error');
        } else {
          setError('An unexpected error occurred. Please try again later.');
          addToast('An unexpected error occurred. Please try again later.', 'error');
        }
      } finally {
        setLoadingMatches(false);
      }
    };
    fetchMatches();
  }, [token, navigate, recipientId, addToast]);

  useEffect(() => {
    const fetchMessages = async () => {
      if (!selectedMatch || !token) return;

      try {
        setLoadingMessages(true);
        const res = await axios.get(`/api/messages/${selectedMatch._id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setMessages(res.data);
        setUnreadCounts((prev) => ({ ...prev, [selectedMatch._id]: { count: 0 } }));
      } catch (err) {
        if (err.response?.status === 401) {
          localStorage.removeItem('token');
          addToast('Session expired. Please log in again.', 'error');
          navigate('/login');
        } else {
          const errorMessage = err.response?.data?.error || 'Failed to fetch messages.';
          setError(errorMessage);
          addToast(errorMessage, 'error');
          console.error('Fetch messages error:', err.message, err.response?.data);
        }
      } finally {
        setLoadingMessages(false);
      }
    };
    fetchMessages();
  }, [selectedMatch, token, navigate, addToast]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedMatch) return;

    try {
      const userId = decodedToken.userId;

      const res = await axios.post('/api/messages', {
        recipientId: selectedMatch._id,
        message: newMessage,
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setMessages((prev) => [
        ...prev,
        { senderId: userId, message: newMessage, createdAt: new Date() },
      ]);

      socketRef.current.emit('sendMessage', {
        senderId: userId,
        recipientId: selectedMatch._id,
        message: newMessage,
      });

      setNewMessage('');
    } catch (err) {
      if (err.response?.status === 401) {
        localStorage.removeItem('token');
        addToast('Session expired. Please log in again.', 'error');
        navigate('/login');
      } else {
        const errorMessage = err.response?.data?.error || 'Failed to send message.';
        setError(errorMessage);
        addToast(errorMessage, 'error');
        console.error('Send message error:', err.message, err.response?.data);
      }
    }
  };

  const handleAvatarError = (e) => {
    console.error('Avatar failed to load, reverting to placeholder:', e.target.src);
    e.target.src = 'https://via.placeholder.com/40?text=User';
    e.target.onerror = null;
  };

  const messageList = useMemo(() => {
    return messages.map((msg, index) => (
      <motion.div
        key={index}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className={`mb-2 flex ${
          msg.senderId === currentUserId ? 'justify-end' : 'justify-start'
        }`}
      >
        <div className="flex items-start space-x-2">
          {msg.senderId !== currentUserId && (
            <img
              src={msg.senderId?.avatar ? `${BACKEND_URL}${msg.senderId.avatar}` : 'https://via.placeholder.com/40?text=User'}
              alt="Sender avatar"
              className="w-8 h-8 rounded-full"
              onError={handleAvatarError}
            />
          )}
          <div>
            <p
              className={`inline-block p-2 rounded-lg text-lg ${
                msg.senderId === currentUserId
                  ? 'bg-teal-500 text-white'
                  : 'bg-gray-600 text-white'
              }`}
            >
              {msg.message}
            </p>
            <p className="text-sm text-gray-400">
              {new Date(msg.createdAt).toLocaleTimeString()}
            </p>
          </div>
          {msg.senderId === currentUserId && (
            <img
              src={msg.senderId?.avatar ? `${BACKEND_URL}${msg.senderId.avatar}` : 'https://via.placeholder.com/40?text=User'}
              alt="Your avatar"
              className="w-8 h-8 rounded-full"
              onError={handleAvatarError}
            />
          )}
        </div>
      </motion.div>
    ));
  }, [messages, currentUserId]);

  if (loadingMatches) return <div className="container mx-auto p-6 min-h-screen bg-gray-100"><p className="text-lg text-gray-900">Loading matches...</p></div>;

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="container mx-auto p-6 min-h-screen bg-gray-100 flex"
    >
      <motion.div
        initial={{ x: -100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        className="w-1/3 bg-gray-900 text-white p-4 rounded-xl shadow-lg"
      >
        <h2 className="text-2xl font-bold mb-4">Matches</h2>
        {error && !matches.length && !selectedMatch && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="text-red-400 text-lg mb-4"
          >
            {error}
          </motion.p>
        )}
        {matches.length ? (
          <div className="space-y-2">
            <AnimatePresence>
              {matches.map((match, index) => (
                <motion.div
                  key={match.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  onClick={() => setSelectedMatch({ _id: match.id, name: match.name, avatar: match.avatar })}
                  className={`p-3 rounded-lg cursor-pointer flex items-center justify-between space-x-3 ${
                    selectedMatch?._id === match.id ? 'bg-gray-700' : 'bg-gray-800'
                  } hover:bg-gray-600 transition`}
                >
                  <div className="flex items-center space-x-3">
                    <img
                      src={match.avatar ? `${BACKEND_URL}${match.avatar}` : 'https://via.placeholder.com/40?text=User'}
                      alt={`${match.name}'s avatar`}
                      className="w-10 h-10 rounded-full"
                      onError={handleAvatarError}
                    />
                    <span className="text-lg">{match.name}</span>
                  </div>
                  {unreadCounts[match.id]?.count > 0 && (
                    <span className="bg-red-500 text-white text-sm font-bold px-2 py-1 rounded-full">
                      {unreadCounts[match.id].count}
                    </span>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="text-lg text-gray-300"
          >
            No matches found. Try connecting with more study buddies!
          </motion.p>
        )}
      </motion.div>
      <motion.div
        initial={{ x: 100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        className="w-2/3 ml-4 bg-gray-900 text-white p-4 rounded-xl shadow-lg flex flex-col"
      >
        {selectedMatch ? (
          <>
            <h2 className="text-2xl font-bold mb-4">Chat with {selectedMatch.name}</h2>
            {loadingMessages ? (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.5 }}
                className="text-lg text-gray-300"
              >
                Loading chat...
              </motion.p>
            ) : (
              <>
                <div className="flex-1 overflow-y-auto bg-gray-700 p-4 rounded-lg mb-4">
                  {messages.length ? (
                    messageList
                  ) : (
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.3, duration: 0.5 }}
                      className="text-lg text-gray-300"
                    >
                      No messages yet.
                    </motion.p>
                  )}
                  <div ref={messagesEndRef} />
                </div>
                <motion.div
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.4, duration: 0.5 }}
                  className="flex gap-2"
                >
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 p-3 bg-gray-700 text-white text-lg border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleSendMessage}
                    className="px-4 py-3 bg-teal-500 text-white text-lg rounded-lg hover:bg-teal-600 transition"
                  >
                    Send
                  </motion.button>
                </motion.div>
              </>
            )}
          </>
        ) : (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="text-lg text-gray-300"
          >
            Select a match to start chatting.
          </motion.p>
        )}
      </motion.div>
    </motion.div>
  );
};

export default Chat;