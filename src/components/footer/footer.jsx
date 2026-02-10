import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaMapMarkerAlt, FaPhone, FaEnvelope, FaClock, FaFacebookF, FaInstagram, FaTwitter, FaYoutube, FaTiktok, FaLinkedin, FaSnapchat } from 'react-icons/fa';
import { FaXTwitter } from 'react-icons/fa6';
import { getClinicsData } from '../../API/apiService';

function Footer() {
  const navigate = useNavigate();
  const [clinics, setClinics] = useState([]);
  const [contactData, setContactData] = useState(null);
  const [socialMedia, setSocialMedia] = useState(null);
  const [websiteSettings, setWebsiteSettings] = useState(null);
  const [websiteLogo, setWebsiteLogo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [logoLoading, setLogoLoading] = useState(true);

  // دالة تحويل رابط الـ embed إلى رابط Google Maps عادي
  const convertEmbedToMapsLink = (embedUrl, fallbackAddress) => {
    if (!embedUrl) return '#';
    
    // لو لينك embed
    if (embedUrl.includes('/maps/embed')) {
      if (fallbackAddress) {
        return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fallbackAddress)}`;
      }
      return 'https://www.google.com/maps';
    }
    
    return embedUrl;
  };

  // دالة للتوجيه إلى صفحة العيادة (نفس الطريقة المستخدمة في ServicesSection)
  const handleClinicClick = (clinicId) => {
    navigate('/Category', { state: { clinicId } });
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // جلب بيانات العيادات
        const clinicsResponse = await getClinicsData();
        if (clinicsResponse.status === 'success' && clinicsResponse.data?.data) {
          const navbarClinics = clinicsResponse.data.data.filter(clinic => clinic.show_in_navbar === 1);
          setClinics(navbarClinics);
        }

        // جلب بيانات الاتصال ووسائل التواصل الاجتماعي
        const contactResponse = await fetch('https://ghaimcenter.com/laravel/api/contact-data');
        const contactResult = await contactResponse.json();
        
        if (contactResult.status === 'success' && contactResult.data) {
          // البحث عن بيانات الاتصال
          const contactInfo = contactResult.data.find(item => item.prefix === 'contact_data');
          if (contactInfo) {
            setContactData(contactInfo.data);
          }

          // البحث عن بيانات وسائل التواصل الاجتماعي
          const socialInfo = contactResult.data.find(item => item.prefix === 'social_media');
          if (socialInfo) {
            setSocialMedia(socialInfo.data);
          }

          // البحث عن إعدادات الموقع
          const websiteInfo = contactResult.data.find(item => item.prefix === 'website_settings');
          if (websiteInfo) {
            setWebsiteSettings(websiteInfo.data);
          }
        }

        // جلب لوجو الموقع
        const logoResponse = await fetch('https://ghaimcenter.com/laravel/api/website-logo');
        const logoResult = await logoResponse.json();
        
        if (logoResult.status === true && logoResult.logo) {
          setWebsiteLogo(logoResult.logo);
        }
        setLogoLoading(false);
      } catch (error) {
        console.error('خطأ في جلب البيانات:', error);
        setLogoLoading(false);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // دالة لتنسيق أوقات العمل
  const formatWorkingTimes = (workingTimes) => {
    if (!workingTimes || !workingTimes.available) return 'غير محدد';
    
    const times = workingTimes.available;
    if (times.length === 0) return 'غير محدد';
    
    // دمج جميع الأوقات المتاحة
    const timeRanges = times.map(time => `${time.start_time} - ${time.end_time}`);
    return timeRanges.join(', ');
  };

  // دالة للحصول على أيقونة وسائل التواصل الاجتماعي
  const getSocialIcon = (platform) => {
    switch (platform.toLowerCase()) {
      case 'facebook': return <FaFacebookF className="text-sm" />;
      case 'instagram': return <FaInstagram className="text-sm" />;
      case 'twitter': return <FaTwitter className="text-sm" />;
      case 'x': return <FaXTwitter className="text-sm" />;
      case 'youtube': return <FaYoutube className="text-sm" />;
      case 'linkedin': return <FaLinkedin className="text-sm" />;
      case 'tiktok': return <FaTiktok className="text-sm" />;
      case 'snapchat': return <FaSnapchat className="text-sm" />;
      default: return <FaFacebookF className="text-sm" />;
    }
  };
  return (
    <footer className="bg-[#0b6fb3] text-white pt-16" dir="rtl">
      <div className="container mx-auto px-6">
        {/* Top Footer */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8 lg:gap-12 border-b border-white/20 pb-12">

          {/* وصف المجمع */}
          <div>
            {logoLoading ? (
              <div className="mb-4 flex items-center justify-start">
                <div className="spinner-footer"></div>
              </div>
            ) : (
              <img src={websiteLogo || "/logoo.png"} alt="مجمع غيم الطبي" />
            )}
            <p
              className="text-sm opacity-90 leading-relaxed mb-6"
              style={{
                fontFamily: 'Almarai',
                fontWeight: 400,
                fontStyle: 'Regular',
                fontSize: '12px',
                leadingTrim: 'NONE',
                lineHeight: '18px',
                letterSpacing: '0%',
                textAlign: 'right',
                verticalAlign: 'middle'
              }}
            >
              {websiteSettings?.description || 'مجمع غيم الطبي متكامل يضم نخبة من المختصين والاستشاريين في مجالي قسم الأسنان والجلدية والليزر والعلاج الطبيعي بأحدث الأجهزة والتقنيات الحديثة'}
            </p>

            {/* معلومات التواصل */}
            <div className="space-y-3">
              {contactData && contactData.address && contactData.google_maps_link && (
                <div className="flex items-center gap-2 text-white mb-4" style={{ fontFamily: 'Almarai', fontWeight:300 }}>
                  <FaMapMarkerAlt className="text-green-400 text-lg flex-shrink-0" />
                  <span className="text-white" style={{
                    fontFamily: 'Almarai',
                    fontWeight: 600,
                    fontStyle: 'Bold',
                    fontSize: '12px',
                    leadingTrim: 'NONE',
                    lineHeight: '26px',
                    letterSpacing: '0%',
                    textAlign: 'right',
                    verticalAlign: 'middle'
                  }}>العنوان:</span>
                  <a 
                    href={convertEmbedToMapsLink(
                      contactData.google_maps_link,
                      contactData.address
                    )}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-white hover:text-green-400 transition-colors cursor-pointer"
                    style={{
                      fontFamily: 'Almarai',
                      fontWeight: 400,
                      fontStyle: 'Regular',
                      fontSize: '10px',
                      leadingTrim: 'NONE',
                      lineHeight: '26px',
                      letterSpacing: '0%',
                      textAlign: 'right',
                      verticalAlign: 'middle'
                    }}
                  >
                    {contactData.address}
                  </a>
                </div>
              )}
              {contactData && contactData.phone && (
                <div className="flex items-center gap-2 text-white" style={{ fontFamily: 'Almarai', fontWeight: 400 }}>
                  <FaPhone className="text-green-400 text-base" />
                  <span className="text-white" style={{
                    fontFamily: 'Almarai',
                    fontWeight: 700,
                    fontStyle: 'Bold',
                    fontSize: '12px',
                    leadingTrim: 'NONE',
                    lineHeight: '26px',
                    letterSpacing: '0%',
                    textAlign: 'right',
                    verticalAlign: 'middle'
                  }}>الهاتف:</span>
                  <a 
                    href={`tel:${contactData.phone}`}
                    className="text-green-400 hover:text-white transition-colors cursor-pointer"
                    style={{
                      fontFamily: 'Almarai',
                      fontWeight: 700,
                      fontStyle: 'Bold',
                      fontSize: '12px',
                      lineHeight: '26px',
                      letterSpacing: '0%',
                      textAlign: 'right',
                      verticalAlign: 'middle'
                    }}
                  >
                    {contactData.phone}
                  </a>
                </div>
              )}
              {contactData && contactData.email && (
                <div className="flex items-center gap-2 text-white" style={{ fontFamily: 'Almarai', fontWeight: 400 }}>
                  <FaEnvelope className="text-green-400 text-base" />
                  <span className="text-white" style={{
                    fontFamily: 'Almarai',
                    fontWeight: 700,
                    fontStyle: 'Bold',
                    fontSize: '12px',
                    leadingTrim: 'NONE',
                    lineHeight: '26px',
                    letterSpacing: '0%',
                    textAlign: 'right',
                    verticalAlign: 'middle'
                  }}>الإيميل:</span>
                  <a 
                    href={`mailto:${contactData.email}`}
                    className="text-green-400 hover:text-white transition-colors cursor-pointer"
                    style={{
                      fontFamily: 'Almarai',
                      fontWeight: 400,
                      fontStyle: 'Regular',
                      fontSize: '12px',
                      lineHeight: '26px',
                      letterSpacing: '0%',
                      textAlign: 'right',
                      verticalAlign: 'middle'
                    }}
                  >
                    {contactData.email}
                  </a>
                </div>
              )}
              {contactData && contactData.working_times && (
                <div className="flex items-center gap-2 text-white" style={{ fontFamily: 'Almarai', fontWeight: 400 }}>
                  <FaClock className="text-green-400 text-base flex-shrink-0" />
                  <span className="text-white" style={{
                    fontFamily: 'Almarai',
                    fontWeight: 700,
                    fontStyle: 'Bold',
                    fontSize: '12px',
                    leadingTrim: 'NONE',
                    lineHeight: '26px',
                    letterSpacing: '0%',
                    textAlign: 'right',
                    verticalAlign: 'middle',
                    whiteSpace: 'nowrap'
                  }}>ساعات العمل:</span>
                  <span className="text-white" style={{
                    fontFamily: 'Almarai',
                    fontWeight: 400,
                    fontStyle: 'Regular',
                    fontSize: '10px',
                    lineHeight: '26px',
                    letterSpacing: '0%',
                    textAlign: 'right',
                    verticalAlign: 'middle'
                  }}>
                    {formatWorkingTimes(contactData.working_times)}
                  </span>
                </div>
              )}
              {loading && (
                <div className="text-center text-white" style={{ fontFamily: 'Almarai' }}>
                  جاري تحميل بيانات التواصل...
                </div>
              )}
            </div>
          </div>

          {/* روابط مهمة */}
          <div className="hidden md:block mr-10">
            <h4 className="mb-4" style={{
              fontFamily: 'Almarai',
              fontWeight: 700,
              fontStyle: 'Bold',
              fontSize: '18px',
              lineHeight: '28.8px',
              letterSpacing: '0%',
              textAlign: 'right',
              verticalAlign: 'middle'
            }}>روابط مهمة</h4>
            <ul className="space-y-2 text-sm opacity-90">
              <li><a href="/about" className="hover:text-white transition-colors">عن المجمع</a></li>
              <li><Link to="/privacy" className="hover:text-white transition-colors">سياسة الخصوصية</Link></li>
              <li><Link to="/return-policy" className="hover:text-white transition-colors">سياسة الإرجاع</Link></li>
              <li><Link to="/terms" className="hover:text-white transition-colors">شروط الخدمة</Link></li>
              <li><Link to="/laser-guidelines" className="hover:text-white transition-colors">إرشادات الليزر</Link></li>
              <li><a href="/blog" className="hover:text-white transition-colors">المدونة</a></li>
              <li><a href="/contact" className="hover:text-white transition-colors">تواصل معنا</a></li>
              <li><a href="/support" className="hover:text-white transition-colors">الدعم</a></li>
            </ul>
          </div>

          {/* الحساب */}
          <div className="hidden md:block">
            <h4 className="mb-4" style={{
              fontFamily: 'Almarai',
              fontWeight: 700,
              fontStyle: 'Bold',
              fontSize: '18px',
              lineHeight: '28.8px',
              letterSpacing: '0%',
              textAlign: 'right',
              verticalAlign: 'middle'
            }}>الحساب</h4>
            <ul className="space-y-2 text-sm opacity-90">
              <li><Link to="/login" className="hover:text-white transition-colors">تسجيل الدخول</Link></li>
              <li><Link to="/dashboard/bookings" className="hover:text-white transition-colors">حجوزاتي</Link></li>
            </ul>
          </div>

          {/* عياداتنا */}
          <div className="hidden md:block">
            <h4 className="mb-4" style={{
              fontFamily: 'Almarai',
              fontWeight: 700,
              fontStyle: 'Bold',
              fontSize: '18px',
              lineHeight: '28.8px',
              letterSpacing: '0%',
              textAlign: 'right',
              verticalAlign: 'middle'
            }}>عياداتنا</h4>
            <ul className="space-y-2 text-sm opacity-90">
              {clinics.length > 0 ? (
                clinics.map(clinic => (
                  <li key={clinic.id}>
                    <span 
                      onClick={() => handleClinicClick(clinic.id)}
                      className="hover:text-white transition-colors cursor-pointer hover:underline"
                      style={{ fontFamily: 'Almarai' }}
                    >
                      {clinic.clinic_name}
                    </span>
                  </li>
                ))
              ) : (
                <>
                  <li>
                    <span className="text-gray-300" style={{ fontFamily: 'Almarai' }}>
                      {loading ? 'جاري تحميل العيادات...' : 'عيادة الأسنان'}
                    </span>
                  </li>
                  <li>
                    <span className="text-gray-300" style={{ fontFamily: 'Almarai' }}>
                      عيادة الجلدية
                    </span>
                  </li>
                  <li>
                    <span className="text-gray-300" style={{ fontFamily: 'Almarai' }}>
                      زر الأسنان
                    </span>
                  </li>
                  <li>
                    <span className="text-gray-300" style={{ fontFamily: 'Almarai' }}>
                      زر الرجال
                    </span>
                  </li>
                </>
              )}
            </ul>
          </div>

          {/* طرق الدفع */}
          <div>
            <h4 className="mb-4" style={{
              fontFamily: 'Almarai',
              fontWeight: 700,
              fontStyle: 'Bold',
              fontSize: '18px',
              lineHeight: '28.8px',
              letterSpacing: '0%',
              textAlign: 'right',
              verticalAlign: 'middle'
            }}>طرق الدفع</h4>
            <p className="text-sm mb-4 opacity-80">
              يمكنك الدفع والتقسيط عبر
            </p>

            <div className="flex gap-3 mb-4">
              <img src="/3b87a60a8e30f980b67d1f4c8d87fb19e275cb93.png" className="h-8" alt="tamara" />
              <img src="/b76ba7212e0ac8087f112b48c9b5ab0dc3231828.png" className="h-8" alt="tabby" />
            </div>

            <p className="text-sm mb-2 opacity-80">أو عن طريق</p>

            <div className="flex gap-3">
              <img src="/abfde2069df20d065d424eb84b76f8b62e604c51.png" className="h-7" alt="mada" />
             
            </div>
          </div>
        </div>

      </div>

      {/* Bottom Bar */}
      <div id="contact-section" className="bg-[#085c96] py-4" dir="ltr">
        <div className="container mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4 text-sm">

          <div className="opacity-80 text-center">
            <p style={{
              fontFamily: 'Almarai',
              fontWeight: 400,
              fontStyle: 'Regular',
              fontSize: '16px',
              leadingTrim: 'NONE',
              lineHeight: '28px',
              letterSpacing: '0%',
              verticalAlign: 'middle'
            }}>© 2022, مجمع غيم الطبي</p>
            <p style={{
              fontFamily: 'Almarai',
              fontWeight: 400,
              fontStyle: 'Regular',
              fontSize: '16px',
              leadingTrim: 'NONE',
              lineHeight: '28px',
              letterSpacing: '0%',
              verticalAlign: 'middle'
            }}>جميع الحقوق محفوظة</p>
          </div>

          <div className="flex gap-6 font-bold text-[#9bc115]">
            {contactData && contactData.phone && (
              <div className="flex flex-col items-center gap-1">
                <div className="flex items-center gap-2">
                  <a 
                    href={`tel:${contactData.phone}`}
                    className="hover:text-white transition-colors cursor-pointer"
                    style={{
                      fontFamily: 'Quicksand',
                      fontWeight: 700,
                      fontStyle: 'Bold',
                      fontSize: '20px',
                      leadingTrim: 'NONE',
                      lineHeight: '26px',
                      letterSpacing: '0%',
                      verticalAlign: 'middle'
                    }}
                  >
                    {contactData.phone}
                  </a>
                  <FaPhone className="text-sm" />
                </div>
                <span className="text-xs text-white" style={{
                  fontFamily: 'Almarai',
                  fontWeight: 400,
                  fontStyle: 'Regular',
                  fontSize: '10px',
                  lineHeight: '16px',
                  textAlign: 'center'
                }}>الدعم 24 ساعة</span>
              </div>
            )}
            {contactData && contactData.whats_app_number && (
              <div className="flex flex-col items-center gap-1">
                <div className="flex items-center gap-2">
                  <a 
                    href={`https://wa.me/${contactData.whats_app_number}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-white transition-colors cursor-pointer"
                    style={{
                      fontFamily: 'Quicksand',
                      fontWeight: 700,
                      fontStyle: 'Bold',
                      fontSize: '20px',
                      leadingTrim: 'NONE',
                      lineHeight: '26px',
                      letterSpacing: '0%',
                      verticalAlign: 'middle'
                    }}
                  >
                    {contactData.whats_app_number}
                  </a>
                  <FaPhone className="text-sm" />
                </div>
                <span className="text-xs text-white" style={{
                  fontFamily: 'Almarai',
                  fontWeight: 400,
                  fontStyle: 'Regular',
                  fontSize: '10px',
                  lineHeight: '16px',
                  textAlign: 'center'
                }}>
                  {contactData.working_times ? `ساعات العمل: ${formatWorkingTimes(contactData.working_times)}` : 'واتساب'}
                </span>
              </div>
            )}
            {loading && (
              <div className="text-center text-white" style={{ fontFamily: 'Almarai' }}>
                جاري تحميل أرقام التواصل...
              </div>
            )}
          </div>

          <div className="flex flex-col items-center gap-3">
            <div className="flex items-center gap-3">
              {socialMedia && Object.entries(socialMedia)
                .filter(([platform, url]) => url && url !== 'https://youtube.com' && url !== 'https://x.com' && url.startsWith('http'))
                .map(([platform, url]) => (
                  <a 
                    key={platform}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-6 h-6 rounded-full bg-[#9bc115] flex items-center justify-center text-white hover:bg-[#8ba614] transition-colors"
                    title={`تابعنا على ${platform}`}
                  >
                    {getSocialIcon(platform)}
                  </a>
                ))}
              
              {/* إذا لم تكن هناك بيانات صحيحة، عرض الأيقونات الافتراضية */}
              {(!socialMedia || Object.entries(socialMedia).filter(([platform, url]) => url && url.startsWith('http')).length === 0) && (
                <>
                  <span className="w-6 h-6 rounded-full bg-[#9bc115] flex items-center justify-center text-white">
                    <FaFacebookF className="text-sm" />
                  </span>
                  <span className="w-6 h-6 rounded-full bg-[#9bc115] flex items-center justify-center text-white">
                    <FaInstagram className="text-sm" />
                  </span>
                  <span className="w-6 h-6 rounded-full bg-[#9bc115] flex items-center justify-center text-white">
                    <FaTwitter className="text-sm" />
                  </span>
                  <span className="w-6 h-6 rounded-full bg-[#9bc115] flex items-center justify-center text-white">
                    <FaYoutube className="text-sm" />
                  </span>
                </>
              )}
              
              <span className="text-lg font-bold text-white ml-auto" style={{
                fontFamily: 'Almarai',
                fontWeight: 400,
                fontStyle: 'Regular',
                fontSize: '14px',
                leadingTrim: 'NONE',
                lineHeight: '28px',
                letterSpacing: '0%',
                textAlign: 'right',
                verticalAlign: 'middle'
              }}>تواصل معانا</span>
            </div>
            <div className="text-center">
              <span style={{
                fontFamily: 'Almarai',
                fontWeight: 400,
                fontStyle: 'Regular',
                fontSize: '14px',
                leadingTrim: 'NONE',
                lineHeight: '28px',
                letterSpacing: '0%',
                textAlign: 'right',
                verticalAlign: 'middle'
              }}>الرقم الضريبي: {websiteSettings?.tax_number || ""}</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
