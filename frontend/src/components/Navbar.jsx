import React from 'react';
   import { Link, useNavigate } from 'react-router-dom';

   const Navbar = () => {
     const token = localStorage.getItem('token');
     const navigate = useNavigate();

     const handleLogout = () => {
       localStorage.removeItem('token');
       navigate('/login');
     };

     return (
       <nav className="bg-black text-white p-4 shadow-lg">
         <div className="container mx-auto flex justify-between items-center">
           <Link to="/" className="text-2xl font-bold">Study Buddy Finder</Link>
           <div className="flex gap-4">
             {token ? (
               <>
                 <Link to="/dashboard" className="hover:text-gray-300">Dashboard</Link>
                 <Link to="/search" className="hover:text-gray-300">Search</Link>
                 <Link to="/notifications" className="hover:text-gray-300">Notifications</Link>
                 <button
                   onClick={handleLogout}
                   className="bg-white text-black px-4 py-2 rounded-lg hover:bg-gray-200 transition"
                 >
                   Logout
                 </button>
               </>
             ) : (
               <>
                 <Link to="/signup" className="hover:text-gray-300">Sign Up</Link>
                 <Link to="/login" className="hover:text-gray-300">Login</Link>
               </>
             )}
           </div>
         </div>
       </nav>
     );
   };

   export default Navbar;