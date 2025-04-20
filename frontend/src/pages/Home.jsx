import React from 'react';
   import { Link } from 'react-router-dom';

   const Home = () => {
     return (
       <div className="container mx-auto p-6 min-h-screen bg-gray-100 flex flex-col items-center justify-center">
         <div className="bg-black text-white p-8 rounded-xl shadow-lg max-w-2xl text-center">
           <h1 className="text-4xl font-bold mb-4">Study Buddy Finder</h1>
           <p className="text-lg text-gray-300 mb-6">
             Connect with students to study together, share knowledge, and achieve your academic goals!
           </p>
           <div className="flex justify-center gap-4">
             <Link
               to="/signup"
               className="px-6 py-3 bg-white text-black rounded-lg hover:bg-gray-200 transition"
             >
               Get Started
             </Link>
             <Link
               to="/login"
               className="px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition"
             >
               Login
             </Link>
           </div>
         </div>
       </div>
     );
   };

   export default Home;