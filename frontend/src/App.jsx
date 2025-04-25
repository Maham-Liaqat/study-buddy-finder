import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastProvider } from './components/ToastContext';
import { AuthProvider, AuthContext } from './context/AuthContext';
import ErrorBoundary from './components/ErrorBoundary';
import Home from './components/Home';
import Login from './components/Login';
import Signup from './pages/Signup';
import ProtectedRoute from './components/ProtectedRoute';
import Dashboard from './components/Dashboard';
import Profile from './components/Profile';
import Search from './components/Search';
import Requests from './components/Requests';
import Matches from './components/Matches';
import Chat from './components/Chat';
import Notifications from './pages/Notifications';
import ForgotPassword from './components/ForgotPassword';
import ResetPassword from './components/ResetPassword';
import Navbar from './components/Navbar';

const App = () => {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <AuthProvider>
          <AuthContext.Consumer>
            {({ token, loading }) => (
              <Router>
                <>
                  <Navbar />
                  {loading ? (
                    <div className="min-h-screen flex items-center justify-center bg-gray-100">
                      <p className="text-lg text-gray-900">Loading...</p>
                    </div>
                  ) : (
                    <Routes>
                      <Route path="/" element={<Home />} />
                      <Route path="/login" element={token ? <Navigate to="/dashboard" /> : <Login />} />
                      <Route path="/signup" element={token ? <Navigate to="/dashboard" /> : <Signup />} />
                      <Route path="/dashboard" element={token ? <Dashboard /> : <Navigate to="/login" />} />
                      <Route path="/profile" element={token ? <Profile /> : <Navigate to="/login" />} />
                      <Route path="/search" element={token ? <Search /> : <Navigate to="/login" />} />
                      <Route path="/requests" element={token ? <Requests /> : <Navigate to="/login" />} />
                      <Route path="/matches" element={token ? <Matches /> : <Navigate to="/login" />} />
                      <Route path="/chat/:recipientId?" element={token ? <Chat /> : <Navigate to="/login" />} />
                      <Route path="/notifications" element={token ? <Notifications /> : <Navigate to="/login" />} />
                      <Route path="/forgot-password" element={<ForgotPassword />} />
                      <Route path="/reset-password/:token" element={<ResetPassword />} />
                    </Routes>
                  )}
                </>
              </Router>
            )}
          </AuthContext.Consumer>
        </AuthProvider>
      </ToastProvider>
    </ErrorBoundary>
  );
};

export default App;