import React from 'react';
   import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
   import Navbar from './components/Navbar';
   import Home from './pages/Home';
   import SignUp from './pages/SignUp';
   import Login from './pages/Login';
   import Dashboard from './pages/Dashboard';
   import Profile from './pages/Profile';
   import Matches from './pages/Matches';
   import Requests from './pages/Requests';
   import Chat from './pages/Chat';
   import Notifications from './pages/Notifications';
   import Search from './pages/Search';

   function App() {
     return (
       <Router>
         <div className="min-h-screen bg-gray-100">
           <Navbar />
           <Routes>
             <Route path="/" element={<Home />} />
             <Route path="/signup" element={<SignUp />} />
             <Route path="/login" element={<Login />} />
             <Route path="/dashboard" element={<Dashboard />} />
             <Route path="/profile" element={<Profile />} />
             <Route path="/matches" element={<Matches />} />
             <Route path="/requests" element={<Requests />} />
             <Route path="/chat" element={<Chat />} />
             <Route path="/notifications" element={<Notifications />} />
             <Route path="/search" element={<Search />} />
           </Routes>
         </div>
       </Router>
     );
   }

   export default App;