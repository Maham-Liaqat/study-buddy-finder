import React from 'react';

const Footer = () => (
  <footer className="fixed bottom-0 left-0 w-full z-40" style={{ background: ' #8D68EA', backdropFilter: 'blur(12px)', borderTop: '2px solid #8f5fe8', color: '#ffffff', boxShadow: '0 -2px 8px rgba(126,166,247,0.08)', fontFamily: 'Roboto, Arial, sans-serif' }}>
    <div className="container mx-auto flex flex-col md:flex-row justify-between items-center py-3 px-4">
      <span className="text-sm font-semibold">&copy; {new Date().getFullYear()} Study Buddy Finder. All rights reserved.</span>
      <div className="flex space-x-4 mt-2 md:mt-0">
        <a href="#about" className="hover:underline">About</a>
        <a href="#testimonials" className="hover:underline">Testimonials</a>
        <a href="mailto:info@studybuddyfinder.com" className="hover:underline">Contact</a>
      </div>
    </div>
  </footer>
);

export default Footer; 