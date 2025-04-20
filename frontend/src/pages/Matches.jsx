import { useState, useEffect } from 'react';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import ProfileCard from '../components/ProfileCard';

const Matches = () => {
  const [matches, setMatches] = useState([]);
  const [error, setError] = useState('');
  const token = localStorage.getItem('token');
  const userId = token ? jwtDecode(token).userId : null;

  const fetchMatches = async () => {
    if (!userId) {
      setError('Please log in to view matches.');
      return;
    }
    try {
      setError('');
      const res = await axios.get(`http://localhost:5000/api/matches?userId=${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMatches(res.data);
    } catch (err) {
      setError('Failed to fetch matches. Try again.');
      console.error(err);
    }
  };

  useEffect(() => {
    fetchMatches();
  }, []);

  return (
    <div className="container mx-auto p-6 min-h-screen bg-gray-100">
      <div className="bg-black text-white p-8 rounded-xl shadow-lg">
        <h1 className="text-3xl font-bold mb-6">Your Study Matches</h1>
        {error && <p className="text-red-500 mb-4">{error}</p>}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {matches.length ? (
            matches.map((match) => (
              <ProfileCard
                key={match._id}
                id={match._id}
                name={match.name}
                subjects={match.subjects}
                bio={match.bio}
                location={match.location}
              />
            ))
          ) : (
            <p className="text-gray-300">No matches found. Complete your profile to find study buddies.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Matches;