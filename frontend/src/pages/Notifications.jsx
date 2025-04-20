import React, { useState, useEffect } from 'react';
   import axios from 'axios';
   import { Link } from 'react-router-dom';

   const Notifications = () => {
     const [notifications, setNotifications] = useState([]);
     const [error, setError] = useState('');
     const token = localStorage.getItem('token');

     useEffect(() => {
       const fetchNotifications = async () => {
         if (!token) {
           setError('Please log in.');
           return;
         }
         try {
           setError('');
           const [requestsRes, messagesRes] = await Promise.all([
             axios.get('http://localhost:5000/api/requests', {
               headers: { Authorization: `Bearer ${token}` },
             }),
             axios.get('http://localhost:5000/api/messages/recent', {
               headers: { Authorization: `Bearer ${token}` },
             }),
           ]);
           const pendingRequests = requestsRes.data
             .filter((req) => req.status === 'pending')
             .map((req) => ({
               id: req._id,
               type: 'request',
               message: `${req.senderName} sent you a connection request`,
               createdAt: req.createdAt,
             }));
           const recentMessages = messagesRes.data.map((msg) => ({
             id: msg._id,
             type: 'message',
             message: `New message from ${msg.senderName}`,
             createdAt: msg.timestamp,
           }));
           setNotifications([...pendingRequests, ...recentMessages].sort(
             (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
           ));
         } catch (err) {
           setError('Failed to fetch notifications.');
           console.error(err);
         }
       };
       fetchNotifications();
     }, [token]);

     const handleAction = async (id, action) => {
       try {
         await axios.patch(
           `http://localhost:5000/api/requests/${id}`,
           { action },
           { headers: { Authorization: `Bearer ${token}` } }
         );
         setNotifications(notifications.filter((notif) => notif.id !== id));
       } catch (err) {
         setError('Failed to process request.');
         console.error(err);
       }
     };

     return (
       <div className="container mx-auto p-6 min-h-screen bg-gray-100">
         <div className="bg-black text-white p-8 rounded-xl shadow-lg">
           <h1 className="text-3xl font-bold mb-6">Notifications</h1>
           {error && <p className="text-red-500 mb-4">{error}</p>}
           {notifications.length ? (
             <div className="space-y-4">
               {notifications.map((notif) => (
                 <div key={notif.id} className="bg-gray-800 p-4 rounded-lg">
                   <p className="text-gray-300">{notif.message}</p>
                   <p className="text-xs text-gray-400">
                     {new Date(notif.createdAt).toLocaleString()}
                   </p>
                   {notif.type === 'request' && (
                     <div className="flex gap-4 mt-3">
                       <button
                         onClick={() => handleAction(notif.id, 'accept')}
                         className="px-4 py-2 bg-white text-black rounded-lg hover:bg-gray-200 transition"
                       >
                         Accept
                       </button>
                       <button
                         onClick={() => handleAction(notif.id, 'decline')}
                         className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition"
                       >
                         Decline
                       </button>
                     </div>
                   )}
                   {notif.type === 'message' && (
                     <Link
                       to="/chat"
                       className="mt-3 inline-block px-4 py-2 bg-white text-black rounded-lg hover:bg-gray-200 transition"
                     >
                       View Message
                     </Link>
                   )}
                 </div>
               ))}
             </div>
           ) : (
             <p className="text-gray-300">No notifications.</p>
           )}
         </div>
       </div>
     );
   };

   export default Notifications;