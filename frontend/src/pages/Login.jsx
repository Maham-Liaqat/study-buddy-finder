import React, { useState } from 'react';
   import axios from 'axios';
   import { useNavigate, Link } from 'react-router-dom';

   const Login = () => {
     const [formData, setFormData] = useState({ email: '', password: '' });
     const [error, setError] = useState('');
     const navigate = useNavigate();

     const handleChange = (e) => {
       setFormData({ ...formData, [e.target.name]: e.target.value });
     };

     const handleSubmit = async () => {
       try {
         setError('');
         const res = await axios.post('http://localhost:5000/api/users/login', formData);
         localStorage.setItem('token', res.data.token);
         navigate('/dashboard');
       } catch (err) {
         setError(err.response?.data?.error || 'Login failed. Try again.');
         console.error(err);
       }
     };

     return (
       <div className="container mx-auto p-6 flex justify-center items-center min-h-screen">
         <div className="bg-black text-white p-8 rounded-xl shadow-lg max-w-md w-full">
           <h1 className="text-3xl font-bold mb-6">Login</h1>
           {error && <p className="text-red-500 mb-4">{error}</p>}
           <div className="flex flex-col gap-4">
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
             <button
               onClick={handleSubmit}
               className="px-6 py-3 bg-white text-black rounded-lg hover:bg-gray-200 transition"
             >
               Login
             </button>
           </div>
           <p className="mt-4 text-center">
             Don't have an account?{' '}
             <Link to="/signup" className="text-gray-300 hover:underline">Sign Up</Link>
           </p>
         </div>
       </div>
     );
   };

   export default Login;