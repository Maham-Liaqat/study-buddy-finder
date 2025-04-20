import React, { useState, useEffect } from 'react';
   import axios from 'axios';

   const Requests = () => {
     const [requests, setRequests] = useState([]);
     const [error, setError] = useState('');

     useEffect(() => {
       const fetchRequests = async () => {
         const token = localStorage.getItem('token');
         if (!token) {
           setError('Please log in.');
           return;
         }
         try {
           setError('');
           const res = await axios.get('http://localhost:5000/api/requests', {
             headers: { Authorization: `Bearer ${token}` },
           });
           setRequests(res.data);
         } catch (err) {
           setError('Failed to fetch requests.');
           console.error(err);
         }
       };
       fetchRequests();
     }, []);

     const handleAction = async (requestId, action) => {
       const token = localStorage.getItem('token');
       try {
         await axios.patch(
           `http://localhost:5000/api/requests/${requestId}`,
           { action },
           { headers: { Authorization: `Bearer ${token}` } }
         );
         setRequests(requests.filter((req) => req._id !== requestId));
       } catch (err) {
         setError('Failed to process request.');
         console.error(err);
       }
     };

     return (
       <div className="container mx-auto p-6 min-h-screen bg-gray-100">
         <div className="bg-black text-white p-8 rounded-xl shadow-lg">
           <h1 className="text-3xl font-bold mb-6">Connection Requests</h1>
           {error && <p className="text-red-500 mb-4">{error}</p>}
           {requests.length ? (
             <div className="space-y-4">
               {requests.map((req) => (
                 <div key={req._id} className="bg-gray-800 p-4 rounded-lg">
                   <p className="font-semibold">{req.senderName}</p>
                   <p className="text-gray-300">{req.message}</p>
                   <div className="flex gap-4 mt-3">
                     <button
                       onClick={() => handleAction(req._id, 'accept')}
                       className="px-4 py-2 bg-white text-black rounded-lg hover:bg-gray-200 transition"
                     >
                       Accept
                     </button>
                     <button
                       onClick={() => handleAction(req._id, 'decline')}
                       className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition"
                     >
                       Decline
                     </button>
                   </div>
                 </div>
               ))}
             </div>
           ) : (
             <p className="text-gray-300">No pending requests.</p>
           )}
         </div>
       </div>
     );
   };

   export default Requests;