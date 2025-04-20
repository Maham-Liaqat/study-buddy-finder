import React, { useState } from 'react';
   import axios from 'axios';
   import { useNavigate, Link } from 'react-router-dom';
   import Error from '../components/Error';

   const SignUp = () => {
     const [formData, setFormData] = useState({
       name: '',
       email: '',
       password: '',
       university: '',
     });
     const [error, setError] = useState('');
     const navigate = useNavigate();

     const handleChange = (e) => {
       setFormData({ ...formData, [e.target.name]: e.target.value });
     };

     const handleSubmit = async () => {
       try {
         setError('');
         await axios.post('http://localhost:5000/api/users/register', formData);
         navigate('/login');
       } catch (err) {
         setError(err.response?.data?.error || 'Registration failed. Try again.');
         console.error(err);
       }
     };

     return (
       <div className="container mx-auto p-6 flex justify-center items-center min-h-screen">
         <div className="bg-black text-white p-8 rounded-xl shadow-lg max-w-md w-full">
           <h1 className="text-3xl font-bold mb-6">Sign Up</h1>
           <Error message={error} />
           <div className="flex flex-col gap-4">
             <input
               type="text"
               name="name"
               value={formData.name}
               onChange={handleChange}
               placeholder="Full Name"
               className="p-3 bg-gray-800 text-white border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500"
             />
             <input
               type="email"
               name="email"
               value={formData.email}
               onChange={handleChange}
               placeholder="Email"
               className="p-3 bg-gray-800 text-white border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500"
             />
             <input
               type="password"
               name="password"
               value={formData.password}
               onChange={handleChange}
               placeholder="Password"
               className="p-3 bg-gray-800 text-white border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500"
             />
             <input
               type="text"
               name="university"
               value={formData.university}
               onChange={handleChange}
               placeholder="University"
               className="p-3 bg-gray-800 text-white border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500"
             />
             <button
               onClick={handleSubmit}
               className="px-6 py-3 bg-white text-black rounded-lg hover:bg-gray-200 transition"
             >
               Sign Up
             </button>
           </div>
           <p className="mt-4 text-center">
             Already have an account?{' '}
             <Link to="/login" className="text-gray-300 hover:underline">Login</Link>
           </p>
         </div>
       </div>
     );
   };

   export default SignUp;