import React, { useState, useEffect } from 'react';

const testimonials = [
  {
    name: 'Aleeha Zainab',
    university: 'LCWU',
    image: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=facearea&w=256&h=256&facepad=2',
    quote: "Study Buddy Finder helped me connect with amazing peers. My grades and confidence have improved so much!"
  },
  {
    name: 'Ayesha Khan',
    university: 'PUCIT',
    image: 'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?auto=format&fit=facearea&w=256&h=256&facepad=2',
    quote: "I found the perfect study group for my computer science course. The sessions are fun and super helpful!"
  },
  {
    name: 'Priya Patel',
    university: 'NUST',
    image: 'https://images.unsplash.com/photo-1465101046530-73398c7f28ca?auto=format&fit=facearea&w=256&h=256&facepad=2',
    quote: "I love how easy it is to find study partners for any subject. The community is so supportive!"
  },
  {
    name: 'Lina Ahmad',
    university: 'LCWU',
    image: 'https://images.unsplash.com/photo-1511367461989-f85a21fda167?auto=format&fit=facearea&w=256&h=256&facepad=2',
    quote: "The virtual study sessions fit my schedule perfectly. I've made friends from all over the world!"
  },
  {
    name: 'Fatima Al-Mansouri',
    university: 'NUST',
    image: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?auto=format&fit=facearea&w=256&h=256&facepad=2',
    quote: "Thanks to Study Buddy Finder, I never feel lost before exams. Highly recommended!"
  }
];

const sliderColors = [
  'linear-gradient(135deg, #e6e6fa 0%, #f7faff 100%)',
  'linear-gradient(135deg, #dbeafe 0%, #e0e7ff 100%)',
  'linear-gradient(135deg, #f7faff 0%, #e6e6fa 100%)',
  'linear-gradient(135deg, #e0e7ff 0%, #f7faff 100%)',
  'linear-gradient(135deg, #e6e6fa 0%, #dbeafe 100%)',
];

const Testimonials = () => {
  const [index, setIndex] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setIndex(i => (i + 1) % testimonials.length), 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <section id="testimonials" className="w-full py-16 flex flex-col items-center" style={{ background: 'var(--gradient-bg)' }}>
      <h2 className="text-3xl font-extrabold mb-12 text-blue-700" style={{ fontFamily: 'Inter, Segoe UI, Roboto, Arial, sans-serif' }}>What Our Students Say</h2>
      <div className="relative w-full max-w-2xl h-[420px] flex items-center justify-center overflow-visible">
        {testimonials.map((t, i) => (
          <div
            key={t.name}
            className={`absolute left-0 top-0 w-full h-full flex flex-col items-center justify-center transition-all duration-1000 ease-in-out ${i === index ? 'opacity-100 scale-105 z-20 shadow-2xl' : 'opacity-0 scale-90 z-0'} ${i === index ? 'shadow-blue-200' : ''}`}
            style={{ background: sliderColors[i], borderRadius: '2rem', boxShadow: i === index ? '0 12px 48px 0 rgba(126,166,247,0.18)' : '0 8px 32px rgba(126,166,247,0.12)', padding: '2.5rem 2rem', border: i === index ? '2px solid #7ea6f7' : '2px solid transparent' }}
          >
            <img src={t.image} alt={t.name} className="w-28 h-28 rounded-full shadow-lg mb-6 border-4 border-white object-cover" style={{ objectFit: 'cover' }} />
            <blockquote className="text-xl italic text-blue-900 mb-6 px-6 text-center" style={{ fontFamily: 'Inter, Segoe UI, Roboto, Arial, sans-serif', minHeight: '90px' }}>
              “{t.quote}”
            </blockquote>
            <div className="text-center">
              <span className="font-bold text-blue-700 text-lg block" style={{ fontFamily: 'Inter, Segoe UI, Roboto, Arial, sans-serif' }}>{t.name}</span>
              <span className="text-blue-400 text-base block mt-1" style={{ fontFamily: 'Inter, Segoe UI, Roboto, Arial, sans-serif' }}>{t.university}</span>
            </div>
            {/* Gradient accent bar below the card */}
            {i === index && (
              <div className="w-24 h-2 mt-8 rounded-full" style={{ background: 'linear-gradient(90deg, #7ea6f7 0%, #8f5fe8 100%)', boxShadow: '0 2px 8px #7ea6f733' }} />
            )}
          </div>
        ))}
      </div>
      <div className="flex justify-center mt-8 space-x-2">
        {testimonials.map((_, i) => (
          <button
            key={i}
            className={`w-3 h-3 rounded-full transition-all duration-300 ${i === index ? 'bg-blue-700 scale-125 shadow-lg' : 'bg-blue-200'} hover:scale-110`}
            onClick={() => setIndex(i)}
            aria-label={`Go to testimonial ${i + 1}`}
          />
        ))}
      </div>
    </section>
  );
};

export default Testimonials; 