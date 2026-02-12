import React, { useEffect } from 'react';
import MainLayout from '../../layouts/mainlayouts';
import WelcomeSection from './sections/WelcomeSection';
import ServicesSection from './sections/ServicesSection';
import FeaturesSection from './sections/FeaturesSection';
import CTASection from './sections/CTASection';
import StatsSection from './sections/StatsSection';
import WhyChooseSection from './sections/WhyChooseSection';
import TestimonialsSection from './sections/TestimonialsSection';
import BlogSection from './sections/BlogSection';
function Home() {
  useEffect(() => {
    document.title = 'مجمع غيم الطبي - الرئيسية';
  }, []);

  return (
    <MainLayout>
<WelcomeSection/>
<div onClick={(e) => console.log('🏠 Home clicked at:', e.target)}>
<ServicesSection/>
</div>
<FeaturesSection/>
<CTASection/>
<StatsSection />
<WhyChooseSection />
<TestimonialsSection/>
<BlogSection/>
    </MainLayout>
  );
}

export default Home;
