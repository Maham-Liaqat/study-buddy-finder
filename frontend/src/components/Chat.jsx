import React, { useState, useEffect, useRef, useMemo } from 'react';
import axios from '../axios';
import { useNavigate, useParams } from 'react-router-dom';
import { getSocket, disconnectSocket } from '../socket';
import { jwtDecode } from 'jwt-decode';
import { useToast } from '../components/ToastContext';
import { motion, AnimatePresence } from 'framer-motion';
import TokenManager from '../utils/tokenManager';
import { FaCheck, FaCheckDouble, FaPaperclip, FaFileAlt, FaFileImage } from 'react-icons/fa';

const Chat = () => {
  const [matches, setMatches] = useState([]);
  const [unreadCounts, setUnreadCounts] = useState({});
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [error, setError] = useState('');
  const [loadingMatches, setLoadingMatches] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [otherTyping, setOtherTyping] = useState(false);
  const typingTimeoutRef = useRef(null);
  const token = TokenManager.getToken();
  const navigate = useNavigate();
  const { recipientId } = useParams();
  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);
  const { addToast } = useToast();
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [editingMsgId, setEditingMsgId] = useState(null);
  const [editText, setEditText] = useState('');

  const decodedToken = useMemo(() => {
    try {
      return token ? jwtDecode(token) : null;
    } catch (err) {
      console.error('Chat: Invalid token:', err.message);
      return null;
    }
  }, [token]);

  const currentUserId = decodedToken?.userId;

  useEffect(() => {
    console.log('Chat: Initializing component');
    if (!token || !decodedToken) {
      console.log('Chat: No token or decoded token, redirecting to login');
      setError('Please log in.');
      setLoadingMatches(false);
      navigate('/login');
      return;
    }

    const userId = decodedToken.userId;

    socketRef.current = getSocket();

    if (socketRef.current) {
      socketRef.current.on('connect', () => {
        console.log('Chat: Connected to Socket.IO server');
        socketRef.current.emit('join', userId);
      });

      socketRef.current.on('connect_error', (err) => {
        console.error('Chat: Socket.IO connection error:', err.message);
        addToast('Failed to connect to the chat server. Real-time messaging may not work.', 'error');
      });

      socketRef.current.on('receiveMessage', ({ senderId, message }) => {
        console.log('Chat: Received message from:', senderId);
        if (selectedMatch && senderId === selectedMatch._id) {
          // Refresh messages to get the latest with proper IDs
          refreshMessages();
        } else {
          setUnreadCounts((prev) => ({
            ...prev,
            [senderId]: (prev[senderId]?.count || 0) + 1,
          }));
        }
      });
    }

    return () => {
      if (socketRef.current) {
        socketRef.current.off('receiveMessage');
        socketRef.current.off('connect_error');
      }
      console.log('Chat: Disconnected from Socket.IO server');
    };
  }, [token, navigate, selectedMatch, decodedToken, addToast]);

  useEffect(() => {
    const fetchWithRetry = async (fn, retries = 3, delay = 2000) => {
      for (let i = 0; i < retries; i++) {
        try {
          return await fn();
        } catch (err) {
          if (i === retries - 1) throw err;
          console.log(`Chat: Retry ${i + 1}/${retries} after error:`, err.message);
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    };

    const fetchMatches = async () => {
      if (!token) {
        console.log('Chat: No token, skipping fetchMatches');
        return;
      }

      try {
        setError('');
        setLoadingMatches(true);
        console.log('Chat: Fetching matches and unread counts...');

        const timeoutPromise = (promise, timeout = 15000) =>
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
          console.log('Chat: Sending request to /api/users/matches');
          const matchesRes = await fetchWithRetry(() =>
            timeoutPromise(
              axios.get('/api/users/matches', {
                headers: { Authorization: `Bearer ${token}` },
              })
            )
          );
          console.log('Chat: Matches response:', matchesRes.data);
          matchesData = matchesRes.data;
          setMatches(matchesData);
        } catch (err) {
          console.error('Chat: Error fetching matches:', err.message, err.response?.status, err.response?.data);
          if (err.response?.status === 401) {
            console.log('Chat: Unauthorized - removing token and redirecting to login');
            TokenManager.removeToken();
            addToast('Session expired. Please log in again.', 'error');
            navigate('/login');
            return;
          }
          addToast('Failed to fetch matches. You can still select a match if available.', 'error');
        }

        // Fetch unread counts
        try {
          console.log('Chat: Sending request to /api/messages/unread-counts');
          const unreadCountsRes = await fetchWithRetry(() =>
            timeoutPromise(
              axios.get('/api/messages/unread-counts', {
                headers: { Authorization: `Bearer ${token}` },
              })
            )
          );
          console.log('Chat: Unread counts response:', unreadCountsRes.data);
          countsData = unreadCountsRes.data;
          setUnreadCounts(countsData);
        } catch (err) {
          console.error('Chat: Error fetching unread counts:', err.message, err.response?.status, err.response?.data);
          if (err.response?.status === 401) {
            console.log('Chat: Unauthorized - removing token and redirecting to login');
            TokenManager.removeToken();
            addToast('Session expired. Please log in again.', 'error');
            navigate('/login');
            return;
          } else if (err.response?.status === 400) {
            addToast('Invalid request for unread counts. Please try again.', 'error');
          } else if (err.message === 'Request timed out') {
            addToast('Request to fetch unread counts timed out. Please check your connection.', 'error');
          } else {
            addToast(`Failed to fetch unread message counts: ${err.response?.data?.error || err.message}`, 'error');
          }
        }

        if (recipientId) {
          console.log('Chat: Checking for recipientId:', recipientId);
          const match = matchesData.find(match => match.id === recipientId);
          if (match) {
            console.log('Chat: Found match for recipientId:', match);
            const formattedMatch = {
              _id: match.id,
              name: match.name,
            };
            setSelectedMatch(formattedMatch);
            setUnreadCounts((prev) => ({ ...prev, [recipientId]: { count: 0 } }));
          } else {
            console.log('Chat: Match not found for recipientId:', recipientId);
            setError('Match not found.');
            addToast('Match not found.', 'error');
          }
        }
      } catch (err) {
        console.error('Chat: Unexpected error in fetchMatches:', err.message);
        if (err.message === 'Request timed out') {
          setError('Request timed out. Please check your connection and try again.');
          addToast('Request timed out. Please check your connection and try again.', 'error');
        } else {
          setError('An unexpected error occurred. Please try again later.');
          addToast('An unexpected error occurred. Please try again later.', 'error');
        }
      } finally {
        setLoadingMatches(false);
        console.log('Chat: fetchMatches complete');
      }
    };
    fetchMatches();
  }, [token, navigate, recipientId, addToast]);

  useEffect(() => {
    const fetchMessages = async () => {
      if (!selectedMatch || !token) {
        console.log('Chat: No selectedMatch or token, skipping fetchMessages');
        return;
      }

      try {
        setLoadingMessages(true);
        console.log('Chat: Fetching messages for selectedMatch:', selectedMatch._id);
        const res = await axios.get(`/api/messages/${selectedMatch._id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        console.log('Chat: Messages response:', res.data);
        setMessages(res.data);
        setUnreadCounts((prev) => ({ ...prev, [selectedMatch._id]: { count: 0 } }));
      } catch (err) {
        console.error('Chat: Fetch messages error:', err.message, err.response?.status, err.response?.data);
        if (err.response?.status === 401) {
          console.log('Chat: Unauthorized - removing token and redirecting to login');
          TokenManager.removeToken();
          addToast('Session expired. Please log in again.', 'error');
          navigate('/login');
        } else if (err.response?.status === 400) {
          setError('Invalid request. The selected user may not be a valid match.');
          addToast('Invalid request. The selected user may not be a valid match.', 'error');
        } else {
          const errorMessage = err.response?.data?.error || 'Failed to fetch messages.';
          setError(errorMessage);
          addToast(errorMessage, 'error');
        }
      } finally {
        setLoadingMessages(false);
        console.log('Chat: fetchMessages complete');
      }
    };
    fetchMessages();
  }, [selectedMatch, token, navigate, addToast]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (!socketRef.current || !selectedMatch) return;
    const handleTyping = ({ senderId }) => {
      if (senderId === selectedMatch._id) {
        setOtherTyping(true);
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => setOtherTyping(false), 2500);
      }
    };
    const handleStopTyping = ({ senderId }) => {
      if (senderId === selectedMatch._id) setOtherTyping(false);
    };
    socketRef.current.on('typing', handleTyping);
    socketRef.current.on('stopTyping', handleStopTyping);
    return () => {
      socketRef.current.off('typing', handleTyping);
      socketRef.current.off('stopTyping', handleStopTyping);
    };
  }, [selectedMatch]);

  const handleFileChange = async (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      const res = await axios.post('/api/messages/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data', Authorization: `Bearer ${token}` },
      });
      setFile({ url: res.data.fileUrl, name: selectedFile.name, type: selectedFile.type });
    } catch (err) {
      addToast('Failed to upload file.', 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleSendMessage = async () => {
    if ((!newMessage.trim() && !file) || !selectedMatch) {
      console.log('Chat: No message or file or selectedMatch, skipping send');
      return;
    }
    try {
      console.log('Chat: Sending message to:', selectedMatch._id);
      const userId = decodedToken.userId;
      const payload = {
        recipientId: selectedMatch._id,
        message: newMessage,
      };
      if (file) payload.fileUrl = file.url;
      const res = await axios.post('/api/messages', payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMessages((prev) => [
        ...prev,
        { 
          _id: res.data._id, // Use the ID from server response
          senderId: userId, 
          message: newMessage, 
          createdAt: new Date(), 
          fileUrl: file ? file.url : undefined, 
          fileType: file ? file.type : undefined, 
          fileName: file ? file.name : undefined, 
          read: false 
        },
      ]);
      socketRef.current.emit('sendMessage', {
        senderId: userId,
        recipientId: selectedMatch._id,
        message: newMessage,
      });
      setNewMessage('');
      setFile(null);
    } catch (err) {
      addToast('Failed to send message.', 'error');
    }
  };

  const handleInputChange = (e) => {
    setNewMessage(e.target.value);
    if (!selectedMatch) return;
    if (!isTyping) {
      setIsTyping(true);
      socketRef.current.emit('typing', { recipientId: selectedMatch._id, senderId: currentUserId });
    }
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      socketRef.current.emit('stopTyping', { recipientId: selectedMatch._id, senderId: currentUserId });
    }, 1500);
  };

  // Helper to group messages by date
  const groupMessagesByDate = (messages) => {
    return messages.reduce((groups, msg) => {
      const date = new Date(msg.createdAt).toLocaleDateString();
      if (!groups[date]) groups[date] = [];
      groups[date].push(msg);
      return groups;
    }, {});
  };

  const handleEdit = (msg) => {
    if (!msg._id) {
      addToast('Cannot edit this message.', 'error');
      return;
    }
    setEditingMsgId(msg._id);
    setEditText(msg.message);
  };

  const handleEditSave = async (msgId) => {
    if (!msgId) {
      addToast('Cannot edit this message.', 'error');
      return;
    }
    try {
      await axios.patch(`/api/messages/${msgId}`, { message: editText }, { headers: { Authorization: `Bearer ${token}` } });
      setMessages((prev) => prev.map(m => m._id === msgId ? { ...m, message: editText, edited: true } : m));
      setEditingMsgId(null);
      setEditText('');
      addToast('Message edited successfully.', 'success');
    } catch (err) {
      console.error('Edit message error:', err);
      addToast('Failed to edit message.', 'error');
    }
  };

  const handleDelete = async (msgId) => {
    if (!msgId) {
      addToast('Cannot delete this message.', 'error');
      return;
    }
    if (!window.confirm('Delete this message?')) return;
    try {
      await axios.delete(`/api/messages/${msgId}`, { headers: { Authorization: `Bearer ${token}` } });
      setMessages((prev) => prev.filter(m => m._id !== msgId));
      addToast('Message deleted successfully.', 'success');
    } catch (err) {
      console.error('Delete message error:', err);
      addToast('Failed to delete message.', 'error');
    }
  };

  const refreshMessages = async () => {
    if (!selectedMatch || !token) return;
    
    try {
      const res = await axios.get(`/api/messages/${selectedMatch._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMessages(res.data);
      setUnreadCounts((prev) => ({ ...prev, [selectedMatch._id]: { count: 0 } }));
    } catch (err) {
      console.error('Failed to refresh messages:', err);
    }
  };

  if (loadingMatches) return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-lg text-gray-700">Loading chat...</p>
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
      <div className="container mx-auto mt-20 p-6 h-screen flex">
      <motion.div
        initial={{ x: -100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.5 }}
          className="w-1/3 bg-white/80 backdrop-blur-sm border border-blue-200/50 p-6 rounded-2xl shadow-xl mr-4"
      >
          <h2 className="text-2xl font-bold mb-6 text-gray-800">Study Buddies</h2>
        {error && !matches.length && !selectedMatch && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
              className="text-red-500 text-lg mb-4"
          >
            {error}
          </motion.p>
        )}
        {matches.length ? (
            <div className="space-y-3">
            <AnimatePresence>
              {matches.map((match, index) => (
                <motion.div
                  key={match.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  onClick={() => setSelectedMatch({ _id: match.id, name: match.name })}
                    className={`p-4 rounded-xl cursor-pointer flex items-center justify-between space-x-3 transition-all duration-300 ${
                      selectedMatch?._id === match.id 
                        ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg' 
                        : 'bg-white/60 hover:bg-white/80 shadow-md hover:shadow-lg'
                    }`}
                >
                  <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                        {match.name.split(' ').map(word => word[0]).join('')}
                      </div>
                      <span className="text-lg font-medium">{match.name}</span>
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
              className="text-lg text-gray-600 text-center"
          >
            No matches found. Try connecting with more study buddies!
          </motion.p>
        )}
      </motion.div>
      <motion.div
        initial={{ x: 100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.5 }}
          className="w-2/3 bg-white/80 backdrop-blur-sm border border-blue-200/50 p-6 rounded-2xl shadow-xl flex flex-col"
      >
        {selectedMatch ? (
          <>
              <h2 className="text-2xl font-bold mb-6 text-gray-800">Chat with {selectedMatch.name}</h2>
            {loadingMessages ? (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.5 }}
                  className="text-lg text-gray-600"
              >
                Loading chat...
              </motion.p>
            ) : (
              <>
                  <div className="flex-1 overflow-y-auto p-4 bg-gray-50/50 rounded-xl mb-4">
                  {messages.length === 0 ? (
                      <div className="text-gray-500 text-center">No messages yet. Start the conversation!</div>
                  ) : (
                    Object.entries(groupMessagesByDate(messages)).map(([date, msgs]) => (
                      <div key={date}>
                          <div className="text-center text-xs text-gray-400 my-2 bg-white/60 px-3 py-1 rounded-full inline-block mx-auto">{date}</div>
                        {msgs.map((msg, idx) => (
                          <div
                            key={msg._id || idx}
                              className={`flex ${msg.senderId === currentUserId ? 'justify-end' : 'justify-start'} mb-3`}
                            >
                              <div className={`max-w-xs px-4 py-3 rounded-2xl shadow-lg relative ${
                                msg.senderId === currentUserId 
                                  ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white' 
                                  : 'bg-white text-gray-800 border border-gray-200'
                              }`}>
                              {msg.fileUrl && (
                                  <div className="mb-2">
                                  {msg.fileType && msg.fileType.startsWith('image') ? (
                                    <a href={msg.fileUrl} target="_blank" rel="noopener noreferrer">
                                        <img src={msg.fileUrl} alt={msg.fileName || 'file'} className="max-h-32 rounded-lg mb-1" />
                                    </a>
                                  ) : (
                                    <a href={msg.fileUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-blue-600 hover:underline">
                                      <FaFileAlt />
                                      <span>{msg.fileName || 'Download file'}</span>
                                    </a>
                                  )}
                                </div>
                              )}
                              {editingMsgId === msg._id ? (
                                  <div className="flex flex-col gap-2">
                                    <input value={editText} onChange={e => setEditText(e.target.value)} className="p-2 rounded-lg text-gray-800 border border-gray-300" />
                                    <div className="flex gap-2">
                                      <button onClick={() => handleEditSave(msg._id)} className="text-xs bg-green-500 text-white px-2 py-1 rounded">Save</button>
                                      <button onClick={() => setEditingMsgId(null)} className="text-xs bg-gray-500 text-white px-2 py-1 rounded">Cancel</button>
                                  </div>
                                </div>
                              ) : (
                                <>
                                  <div className="text-sm flex items-center gap-1">
                                    {msg.message}
                                      {msg.edited && <span className="text-xs opacity-75 ml-1">(edited)</span>}
                                  </div>
                                    <div className="flex items-center gap-1 mt-2 text-xs opacity-75 justify-end">
                                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    {msg.senderId === currentUserId && msg._id && (
                                      <>
                                          {msg.read ? <FaCheckDouble className="ml-1" title="Seen" /> : <FaCheck className="ml-1" title="Sent" />}
                                          <button onClick={() => handleEdit(msg)} className="ml-2 text-xs hover:underline">Edit</button>
                                          <button onClick={() => handleDelete(msg._id)} className="ml-1 text-xs hover:underline">Delete</button>
                                      </>
                                    )}
                                  </div>
                                </>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ))
                  )}
                </div>
                {otherTyping && (
                    <div className="text-xs text-gray-500 mb-2 italic">{selectedMatch.name} is typing...</div>
                )}
                <motion.div
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.4, duration: 0.5 }}
                    className="flex gap-3"
                >
                  <input
                    type="text"
                    value={newMessage}
                    onChange={handleInputChange}
                    placeholder="Type a message..."
                      className="flex-1 p-3 bg-white/70 border border-blue-200 text-gray-800 text-lg rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                  />
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleSendMessage}
                      className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white text-lg rounded-xl hover:shadow-lg transition-all duration-300 font-semibold"
                  >
                    Send
                  </motion.button>
                </motion.div>
                  <div className="flex items-center gap-3 mt-3">
                    <label className="cursor-pointer flex items-center gap-2 text-blue-600 hover:text-blue-700 transition-colors">
                      <FaPaperclip className="text-lg" />
                    <input type="file" className="hidden" onChange={handleFileChange} disabled={uploading} />
                      {uploading && <span className="text-xs">Uploading...</span>}
                  </label>
                  {file && (
                      <span className="flex items-center gap-2 bg-blue-50 text-blue-800 px-3 py-2 rounded-lg border border-blue-200">
                      {file.type && file.type.startsWith('image') ? <FaFileImage /> : <FaFileAlt />}
                      <span className="truncate max-w-xs">{file.name}</span>
                        <button onClick={() => setFile(null)} className="ml-1 text-red-500 hover:text-red-700">&times;</button>
                    </span>
                  )}
                </div>
              </>
            )}
          </>
        ) : (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
              className="text-lg text-gray-600 text-center"
          >
              Select a study buddy to start chatting.
          </motion.p>
        )}
      </motion.div>
      </div>
    </motion.div>
  );
};

export default Chat;