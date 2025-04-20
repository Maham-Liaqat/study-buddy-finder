import React, { useState, useEffect } from 'react';
   import axios from 'axios';
   import ProfileCard from '../components/ProfileCard';

   const Search = () => {
     const [filters, setFilters] = useState({
       subject: '',
       availability: '',
       location: '',
     });
     const [results, setResults] = useState([]);
     const [error, setError] = useState('');
     const token = localStorage.getItem('token');

     const handleFilterChange = (e) => {
       setFilters({ ...filters, [e.target.name]: e.target.value });
     };

     const handleSearch = async () => {
       if (!token) {
         setError('Please log in.');
         return;
       }
       try {
         setError('');
         const query = new URLSearchParams();
         if (filters.subject) query.append('subject', filters.subject);
         if (filters.availability) query.append('availability', filters.availability);
         if (filters.location) query.append('location', filters.location);
         const res = await axios.get(`http://localhost:5000/api/users/search?${query.toString()}`, {
           headers: { Authorization: `Bearer ${token}` },
         });
         setResults(res.data);
       } catch (err) {
         setError('Failed to search users.');
         console.error(err);
       }
     };

     useEffect(() => {
       handleSearch();
     }, []);

     return (
       <div className="container mx-auto p-6 min-h-screen bg-gray-100">
         <div className="bg-black text-white p-8 rounded-xl shadow-lg">
           <h1 className="text-3xl font-bold mb-6">Search Study Buddies</h1>
           {error && <p className="text-red-500 mb-4">{error}</p>}
           <div className="flex flex-col sm:flex-row gap-4 mb-6">
             <input
               type="text"
               name="subject"
               value={filters.subject}
               onChange={handleFilterChange}
               placeholder="Subject (e.g., Calculus)"
               className="p-3 bg-gray-800 text-white border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500"
             />
             <select
               name="availability"
               value={filters.availability}
               onChange={handleFilterChange}
               className="p-3 bg-gray-800 text-white border border-gray-700 rounded-lg"
             >
               <option value="">Select Availability</option>
               <option value="Monday">Monday</option>
               <option value="Tuesday">Tuesday</option>
               <option value="Wednesday">Wednesday</option>
               <option value="Thursday">Thursday</option>
               <option value="Friday">Friday</option>
             </select>
             <input
               type="text"
               name="location"
               value={filters.location}
               onChange={handleFilterChange}
               placeholder="Location (e.g., New York)"
               className="p-3 bg-gray-800 text-white border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500"
             />
             <button
               onClick={handleSearch}
               className="px-6 py-3 bg-white text-black rounded-lg hover:bg-gray-200 transition"
             >
               Search
             </button>
           </div>
           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
             {results.length ? (
               results.map((user) => (
                 <ProfileCard
                   key={user._id}
                   id={user._id}
                   name={user.name}
                   subjects={user.subjects}
                   bio={user.bio}
                   location={user.location}
                 />
               ))
             ) : (
               <p className="text-gray-300">No users found. Try adjusting your filters.</p>
             )}
           </div>
         </div>
       </div>
     );
   };

   export default Search;