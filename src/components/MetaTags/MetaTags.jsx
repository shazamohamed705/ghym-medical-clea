import { useEffect, useState } from 'react';

function MetaTags() {
  const [websiteSettings, setWebsiteSettings] = useState(null);
  const [websiteLogo, setWebsiteLogo] = useState(null);

  useEffect(() => {
    const fetchMetaData = async () => {
      try {
        const [contactRes, logoRes] = await Promise.all([
          fetch('https://ghaimcenter.com/laravel/api/contact-data'),
          fetch('https://ghaimcenter.com/laravel/api/website-logo'),
        ]);

        const contactResult = await contactRes.json();
        const logoResult = await logoRes.json();

        if (contactResult.status === 'success') {
          const websiteInfo = contactResult.data.find(
            item => item.prefix === 'website_settings'
          );
          if (websiteInfo) setWebsiteSettings(websiteInfo.data);
        }

        if (logoResult.status === true && logoResult.logo) {
          setWebsiteLogo(logoResult.logo);
        }
      } catch (e) {
        console.error('Meta fetch error:', e);
      }
    };

    fetchMetaData();
  }, []);

  useEffect(() => {
    const setMeta = (name, content) => {
      if (!content) return;
      let tag = document.querySelector(`meta[name="${name}"]`);
      if (!tag) {
        tag = document.createElement('meta');
        tag.name = name;
        document.head.appendChild(tag);
      }
      tag.setAttribute('content', content);
    };

    const setLink = (rel, href) => {
      if (!href) return;
      let link = document.querySelector(`link[rel="${rel}"]`);
      if (!link) {
        link = document.createElement('link');
        link.rel = rel;
        document.head.appendChild(link);
      }
      link.href = href;
    };

    if (websiteSettings?.title) {
      document.title = websiteSettings.title;
    }

    setMeta('description', websiteSettings?.description);
    setMeta('keywords', websiteSettings?.meta_keywords);

    if (websiteLogo) {
      const iconUrl = websiteLogo + '?v=' + new Date().getTime();
      let favicon = document.querySelector('link[rel="icon"]');
      if (!favicon) {
        favicon = document.createElement('link');
        favicon.rel = 'icon';
        document.head.appendChild(favicon);
      }
      favicon.href = iconUrl;
      
      let appleIcon = document.querySelector('link[rel="apple-touch-icon"]');
      if (!appleIcon) {
        appleIcon = document.createElement('link');
        appleIcon.rel = 'apple-touch-icon';
        document.head.appendChild(appleIcon);
      }
      appleIcon.href = iconUrl;
    }
  }, [websiteSettings, websiteLogo]);

  return null;
}

export default MetaTags;
