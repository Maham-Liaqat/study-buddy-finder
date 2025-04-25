import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import ConnectModal from './ConnectModal';

const ProfileCard = ({ id, name, subjects, bio, location, matchPercentage, connectionStatus }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="bg-gray-800 text-white p-6 rounded-lg shadow-lg">
      <h3 className="text-xl font-bold mb-2">{name}</h3>
      {matchPercentage !== undefined && (
        <p className="text-green-400 mb-2">{matchPercentage}% Match</p>
      )}
      <p className="text-gray-300 mb-2"><strong>Subjects:</strong> {subjects?.join(', ') || 'N/A'}</p>
      <p className="text-gray-300 mb-2"><strong>Bio:</strong> {bio || 'N/A'}</p>
      <p className="text-gray-300 mb-4"><strong>Location:</strong> {location || 'N/A'}</p>
      {connectionStatus === 'accepted' ? (
        <Link
          to={`/chat/${id}`}
          className="w-full bg-white text-black px-4 py-2 rounded-lg hover:bg-gray-200 transition text-center"
        >
          Chat
        </Link>
      ) : connectionStatus === 'pending' ? (
        <p className="text-yellow-400">Request Sent</p>
      ) : (
        <button
          onClick={() => setIsModalOpen(true)}
          className="w-full bg-white text-black px-4 py-2 rounded-lg hover:bg-gray-200 transition"
        >
          Connect
        </button>
      )}
      {isModalOpen && (
        <ConnectModal
          recipientId={id}
          recipientName={name}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </div>
  );
};

export default ProfileCard;