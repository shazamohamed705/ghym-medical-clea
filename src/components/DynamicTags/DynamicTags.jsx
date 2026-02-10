import { Helmet } from 'react-helmet-async';
import { useEffect } from 'react';

const DynamicTags = ({ tags }) => {
  useEffect(() => {
    if (!tags) return;

    const {
      google_tag_manager,
      google_analytics_main,
      google_ads_conversion_purchase,
      google_ads_remarketing
    } = tags;

    // Load Google Analytics script dynamically
    if (google_analytics_main) {
      // Check if already loaded
      if (!window.gtagLoaded) {
        const script = document.createElement('script');
        script.async = true;
        script.src = `https://www.googletagmanager.com/gtag/js?id=${google_analytics_main}`;
        document.head.appendChild(script);
        
        // Initialize gtag after script loads
        script.onload = () => {
          if (window.gtag) {
            window.gtag('js', new Date());
            window.gtag('config', google_analytics_main);
            window.gtagLoaded = true;
          }
        };
      } else if (window.gtag) {
        // If already loaded, just update config
        window.gtag('config', google_analytics_main);
      }
    }

    // Configure Google Ads Conversion Purchase
    if (google_ads_conversion_purchase && window.gtag) {
      window.gtag('config', google_ads_conversion_purchase);
    }

    // Configure Google Ads Remarketing
    if (google_ads_remarketing && window.gtag) {
      window.gtag('config', google_ads_remarketing);
    }

    // Load Google Tag Manager if needed
    if (google_tag_manager) {
      if (!window.gtmLoaded) {
        const gtmScript = document.createElement('script');
        gtmScript.async = true;
        gtmScript.src = `https://www.googletagmanager.com/gtm.js?id=${google_tag_manager}`;
        document.head.appendChild(gtmScript);
        window.gtmLoaded = true;
      }
    }
  }, [tags]);

  if (!tags) return null;

  return (
    <Helmet>
      {/* Meta tags can be added here if needed */}
    </Helmet>
  );
};

export default DynamicTags;
