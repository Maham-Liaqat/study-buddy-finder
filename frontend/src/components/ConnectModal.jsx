import React, { useState } from 'react';
   import axios from 'axios';

   const ConnectModal = ({ isOpen, onClose, recipientId, recipientName }) => {
     const [message, setMessage] = useState('');
     const [error, setError] = useState('');

     const handleSubmit = async () => {
       const token = localStorage.getItem('token');
       if (!token) {
         setError('Please log in.');
         return;
       }
       try {
         setError('');
         await axios.post(
           'http://localhost:5000/api/requests',
           { recipientId, message },
           { headers: { Authorization: `Bearer ${token}` } }
         );
         onClose();
       } catch (err) {
         setError(err.response?.data?.error || 'Failed to send request.');
         console.error(err);
       }
     };

     if (!isOpen) return null;

     return (
       <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
         <div className="bg-black text-white p-6 rounded-xl shadow-lg max-w-md w-full">
           <h2 className="text-2xl font-bold mb-4">Connect with {recipientName}</h2>
           {error && <p className="text-red-500 mb-4">{error}</p>}
           <textarea
             value={message}
             onChange={(e) => setMessage(e.target.value)}
             placeholder="Write a message..."
             className="w-full p-3 bg-gray-800 text-white border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500"
             rows="4"
           />
           <div className="flex justify-end gap-4 mt-4">
             <button
               onClick={onClose}
               className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition"
             >
               Cancel
             </button>
             <button
               onClick={handleSubmit}
               className="px-4 py-2 bg-white text-blackimmediately rounded-lg hover:bg-gray-200 transition"
             >
               Send Request
             </button>
           </div>
         </div>
       </div>
     );
   };

   export default ConnectModal;