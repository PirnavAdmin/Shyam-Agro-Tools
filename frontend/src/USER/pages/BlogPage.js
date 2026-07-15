import React, { useState } from 'react';
import Header from '../components/Header';
import BlogSection from '../components/BlogSection';
import Footer from '../components/Footer';
import LoginPopup from '../components/LoginPopup';

const BlogPage = () => {
  const [isLoginOpen, setIsLoginOpen] = useState(false);

  return (
    <div className="blog-page flex min-h-screen flex-col bg-white">
      <Header onLoginClick={() => setIsLoginOpen(true)} />
      <main className="flex-grow pt-4">
        <BlogSection />
      </main>
      <Footer />
      <LoginPopup isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} />
    </div>
  );
};

export default BlogPage;
