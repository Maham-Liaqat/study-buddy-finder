import React, { useEffect } from 'react';
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
import { preventClickjacking, checkSecureContext } from './utils/security';
import Sessions from './pages/Sessions';
import AdminPanel from './components/AdminPanel';
import NotificationManager from './components/NotificationManager';

const App = () => {
  // Security checks on app initialization
  useEffect(() => {
    preventClickjacking();
    checkSecureContext();
  }, []);

  return (
    <ErrorBoundary>
      <ToastProvider>
        <AuthProvider>
          <AuthContext.Consumer>
            {({ token, loading }) => (
              <Router>
                <>
                  <Navbar />
                  <NotificationManager />
                  {loading ? (
                    <div className="min-h-screen flex items-center justify-center bg-gray-100">
                      <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                        <p className="mt-4 text-lg text-gray-900">Loading...</p>
                      </div>
                    </div>
                  ) : (
                    <Routes>
                      <Route path="/" element={<Home />} />
                      <Route path="/login" element={token ? <Navigate to="/dashboard" /> : <Login />} />
                      <Route path="/signup" element={token ? <Navigate to="/dashboard" /> : <Signup />} />
                      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                      <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                      <Route path="/search" element={<ProtectedRoute><Search /></ProtectedRoute>} />
                      <Route path="/requests" element={<ProtectedRoute><Requests /></ProtectedRoute>} />
                      <Route path="/matches" element={<ProtectedRoute><Matches /></ProtectedRoute>} />
                      <Route path="/chat/:recipientId?" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
                      <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
                      <Route path="/forgot-password" element={<ForgotPassword />} />
                      <Route path="/reset-password/:token" element={<ResetPassword />} />
                      <Route path="/sessions" element={<ProtectedRoute><Sessions /></ProtectedRoute>} />
                      <Route path="/admin" element={<AdminPanel />} />
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