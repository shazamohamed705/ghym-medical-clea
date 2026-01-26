import React from 'react';
import Navbar from '../components/Navbar/Navbar';
import MainNavbar from '../components/Navbar/MainNavbar';
import BannerCarousel from '../components/Banner/BannerCarousel';
import Footer from '../components/footer/footer';

function MainLayout({ children }) {
  return (
<div className="flex flex-col min-h-screen overflow-x-hidden">

      <Navbar />
      <MainNavbar />
      <BannerCarousel />

      {/* هنا مفيش padding */}
      <main className="flex-1 w-full">
        {children}
      </main>

      <Footer />
    </div>
  );
}


export default MainLayout;
