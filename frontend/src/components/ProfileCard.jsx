import React, { useState } from 'react';
   import ConnectModal from './ConnectModal';

   const ProfileCard = ({ name, subjects, bio, location, id }) => {
     const [isModalOpen, setIsModalOpen] = useState(false);

     return (
       <>
         <div className="bg-black text-white p-6 rounded-xl shadow-lg hover:bg-gray-700 transition max-w-sm">
           <h2 className="text-2xl font-semibold mb-2">{name}</h2>
           <p className="text-gray-300 mb-3">
             <span className="font-medium">Subjects:</span>{' '}
             {subjects?.length ? subjects.map((s) => s.name).join(', ') : 'None'}
           </p>
           <p className="text-gray-300 mb-4 line-clamp-3">{bio || 'No bio available'}</p>
           <p className="text-sm text-gray-400 mb-4">
             <span role="img" aria-label="location">📍</span> {location || 'Unknown'}
           </p>
           <button
             onClick={() => setIsModalOpen(true)}
             className="w-full bg-white text-black py-2 rounded-lg hover:bg-gray-200 transition"
           >
             Connect
           </button>
         </div>
         <ConnectModal
           isOpen={isModalOpen}
           onClose={() => setIsModalOpen(false)}
           recipientId={id}
           recipientName={name}
         />
       </>
     );
   };

   export default ProfileCard;