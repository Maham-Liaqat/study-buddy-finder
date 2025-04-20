import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';

const socket = io('http://localhost:5000');

const Chat = () => {
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState('');

  useEffect(() => {
    socket.on('message', (msg) => {
      setMessages((prev) => [...prev, msg]);
    });
    return () => socket.off('message');
  }, []);

  const sendMessage = () => {
    if (message.trim()) {
      socket.emit('message', { text: message, sender: 'You' });
      setMessage('');
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Chat</h1>
      <div className="border p-4 h-64 overflow-y-auto mb-4">
        {messages.map((msg, i) => (
          <p key={i} className="text-gray-800">
            {msg.sender}: {msg.text}
          </p>
        ))}
      </div>
      <div className="flex">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type a message"
          className="p-2 border rounded-l w-full"
        />
        <button
          onClick={sendMessage}
          className="p-2 bg-blue-500 text-white rounded-r hover:bg-blue-600"
        >
          Send
        </button>
      </div>
    </div>
  );
};

export default Chat;