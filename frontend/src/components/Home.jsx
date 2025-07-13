import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import Testimonials from './Testimonials';
import Footer from './Footer';

const Home = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (location.state?.scrollTo) {
      const section = document.getElementById(location.state.scrollTo);
      if (section) {
        section.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }, [location]);

  const scrollToSection = (sectionId) => {
    const section = document.getElementById(sectionId);
    if (section) {
      section.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Animation variants for About section
  const aboutVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.8, delay: 0.2 } },
  };

  // Animation variants for Testimonials cards
  const testimonialVariants = {
    hidden: { opacity: 0, x: (index) => (index % 2 === 0 ? -50 : 50) },
    visible: (index) => ({
      opacity: 1,
      x: 0,
      transition: { duration: 0.6, delay: index * 0.2 },
    }),
  };

  return (
    <div className="bg-gray-100">
      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
        className="min-h-screen flex flex-col items-center justify-center text-center p-6 relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #e6e6fa 0%, #dbeafe 100%)', boxShadow: '0 8px 32px rgba(126,166,247,0.10)' }}
      >
        {/* Background image with overlay */}
        <img
          src="https://images.unsplash.com/photo-1503676382389-4809596d5290?auto=format&fit=crop&w=1200&q=80"
          alt="Students studying together"
          className="absolute inset-0 w-full h-full object-cover opacity-50 pointer-events-none select-none"
          style={{ zIndex: 0 }}
        />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.7) 60%, rgba(230,230,250,0.7) 100%)', zIndex: 1 }} />
        <div className="relative z-10 flex flex-col items-center justify-center w-full">
        <motion.h1
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
            className="text-5xl font-extrabold mb-4 text-blue-700"
            style={{ fontFamily: 'Inter, Segoe UI, Roboto, Arial, sans-serif' }}
        >
          Welcome to Study Buddy Finder
        </motion.h1>
        <motion.p
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.5 }}
            className="text-lg mb-8 max-w-md text-blue-900"
            style={{ fontFamily: 'Inter, Segoe UI, Roboto, Arial, sans-serif' }}
        >
          Connect with study partners who share your interests and availability. Find the perfect buddy to ace your studies!
        </motion.p>
        <div className="flex gap-4">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/login')}
              className="px-6 py-3 rounded-lg text-lg font-bold text-white shadow-md transition"
              style={{ background: 'linear-gradient(90deg, #7ea6f7 0%, #8f5fe8 100%)' }}
          >
            Login
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/signup')}
              className="px-6 py-3 rounded-lg text-lg font-bold text-white shadow-md transition"
              style={{ background: 'linear-gradient(90deg, #8f5fe8 0%, #7ea6f7 100%)' }}
          >
            Get Started
          </motion.button>
          </div>
        </div>
      </motion.div>

      {/* About Section */}
      <motion.section
        id="about"
        className="py-16 relative overflow-hidden"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        style={{ background: 'linear-gradient(135deg, #dbeafe 0%, #e6e6fa 100%)', boxShadow: '0 8px 32px rgba(126,166,247,0.10)' }}
      >
        <div className="container mx-auto px-4">
          <motion.h2
            className="text-4xl font-extrabold text-center mb-8 text-blue-700"
            style={{ fontFamily: 'Inter, Segoe UI, Roboto, Arial, sans-serif' }}
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            viewport={{ once: true }}
          >
            About Study Buddy Finder
          </motion.h2>
          <div className="max-w-4xl mx-auto bg-white p-8 rounded-lg shadow-lg">
            <motion.div
              className="flex items-center justify-center mb-6"
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              viewport={{ once: true }}
            >
              <i className="fas fa-book-open text-blue-400 text-4xl mr-3"></i>
              <h3 className="text-2xl font-semibold text-blue-900" style={{ fontFamily: 'Inter, Segoe UI, Roboto, Arial, sans-serif' }}>
                Connecting Students Worldwide
              </h3>
            </motion.div>
            <motion.p
              className="text-lg text-blue-900 mb-4 leading-relaxed"
              style={{ fontFamily: 'Inter, Segoe UI, Roboto, Arial, sans-serif' }}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.3 }}
              viewport={{ once: true }}
            >
              Study Buddy Finder is a platform designed to help students connect with like-minded peers for collaborative learning. Whether you're looking for someone to study with, share notes, or tackle challenging subjects together, we've got you covered.
            </motion.p>
            <motion.p
              className="text-lg text-blue-900 mb-4 leading-relaxed"
              style={{ fontFamily: 'Inter, Segoe UI, Roboto, Arial, sans-serif' }}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.5 }}
              viewport={{ once: true }}
            >
              Our mission is to foster a supportive community where students can thrive academically and socially. With features like real-time chat, personalized matching, and notification alerts, finding the perfect study buddy has never been easier.
            </motion.p>
            <motion.p
              className="text-lg text-blue-900 leading-relaxed"
              style={{ fontFamily: 'Inter, Segoe UI, Roboto, Arial, sans-serif' }}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.7 }}
              viewport={{ once: true }}
            >
              Join thousands of students who are already benefiting from Study Buddy Finder. Start your journey today and unlock a world of collaborative learning opportunities!
            </motion.p>

            {/* About the Owner Section */}
            <motion.div
              className="mt-10 mb-6 p-6 rounded-lg bg-gradient-to-r from-blue-50 to-purple-50 border-l-4 border-blue-400 shadow-md"
              initial={{ opacity: 0, x: -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7, delay: 0.8 }}
              viewport={{ once: true }}
            >
              <div className="flex items-center mb-2">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-400 to-purple-400 flex items-center justify-center text-white text-2xl font-bold mr-4 shadow-lg">
                  ML
                </div>
                <div>
                  <h4 className="text-xl font-bold text-blue-700">Maham Liaqat</h4>
                  <p className="text-blue-800 text-sm font-medium">MERN Stack Developer</p>
                </div>
              </div>
              <p className="text-blue-900 mb-2">I created Study Buddy Finder to help students connect, collaborate, and succeed together. My goal is to make learning more social, accessible, and fun for everyone.</p>
            </motion.div>

            {/* Contact Section */}
            <motion.div
              className="mb-2 p-6 rounded-lg bg-gradient-to-r from-purple-50 to-blue-50 border-l-4 border-purple-400 shadow-md"
              initial={{ opacity: 0, x: 40 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7, delay: 1 }}
              viewport={{ once: true }}
            >
              <h4 className="text-lg font-bold text-purple-700 mb-2">Contact</h4>
              <p className="text-blue-900 mb-1">Have questions, feedback, or want to collaborate? I'd love to hear from you!</p>
              <p className="text-blue-900">📧 <a href="mailto:mahamliaqat1234@gmail.com" className="underline text-blue-700 hover:text-purple-700">mahamliaqat1234@gmail.com</a></p>
            </motion.div>
          </div>
        </div>
        {/* Subtle Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="w-full h-full bg-[url('https://www.transparenttextures.com/patterns/white-diamond.png')]" />
        </div>
      </motion.section>

      {/* Testimonials Section */}
      <Testimonials />

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default Home;