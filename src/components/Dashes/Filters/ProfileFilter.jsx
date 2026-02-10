import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaUser, FaPhone, FaEnvelope, FaMapMarkerAlt, FaCamera, FaEdit, FaLock, FaKey, FaEye, FaEyeSlash } from 'react-icons/fa';
import { useAuth } from '../../../contexts/AuthContext';
import profileImage from '../../../assets/photo/service.png';
import { sendPasswordChangeOTP, verifyPasswordChangeOTP, changePasswordWithOTP } from '../../../API/apiService';

// Profile filter component - User profile management
const ProfileFilter = ({
  isEditing,
  profileData,
  uploadedImage,
  handleEditToggle,
  handleCancelEdit,
  handleInputChange,
  handleImageChange
}) => {
  const navigate = useNavigate();
  const { logout } = useAuth(); // Get logout function from AuthContext
  
  // Password change states
  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [passwordStep, setPasswordStep] = useState(1); // 1: phone, 2: otp, 3: new password
  const [passwordData, setPasswordData] = useState({
    phoneNumber: '',
    otp: ['', '', '', '', '', ''],
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [otpTimer, setOtpTimer] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState('');
  const [passwordError, setPasswordError] = useState('');

  // OTP timer effect
  React.useEffect(() => {
    let interval = null;
    if (otpTimer > 0) {
      interval = setInterval(() => {
        setOtpTimer(timer => timer - 1);
      }, 1000);
    } else if (otpTimer === 0) {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [otpTimer]);

  // Handle password section toggle
  const handlePasswordSectionToggle = () => {
    setShowPasswordSection(!showPasswordSection);
    if (!showPasswordSection) {
      // Reset all password states when opening
      setPasswordStep(1);
      setPasswordData({
        phoneNumber: profileData.phone || '',
        otp: ['', '', '', '', '', ''],
        newPassword: '',
        confirmPassword: ''
      });
      setPasswordMessage('');
      setPasswordError('');
      setOtpTimer(0);
    }
  };

  // Handle phone number input
  const handlePhoneChange = (value) => {
    // Only allow numbers and limit to 10 digits for Saudi format
    const cleanValue = value.replace(/\D/g, '');
    if (cleanValue.length <= 10) {
      setPasswordData(prev => ({ ...prev, phoneNumber: cleanValue }));
    }
  };

  // Handle OTP input
  const handleOtpChange = (index, value) => {
    if (value.length > 1) return; // Only allow single digit
    
    const newOtp = [...passwordData.otp];
    newOtp[index] = value;
    setPasswordData(prev => ({ ...prev, otp: newOtp }));

    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`password-otp-${index + 1}`);
      if (nextInput) nextInput.focus();
    }
  };

  // Handle OTP key down for backspace
  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !passwordData.otp[index] && index > 0) {
      const prevInput = document.getElementById(`password-otp-${index - 1}`);
      if (prevInput) prevInput.focus();
    }
  };

  // Send OTP for password change
  const handleSendPasswordOTP = async () => {
    if (!passwordData.phoneNumber) {
      setPasswordError('يرجى إدخال رقم الهاتف');
      return;
    }

    if (!/^05\d{8}$/.test(passwordData.phoneNumber)) {
      setPasswordError('يرجى إدخال رقم هاتف صحيح (05xxxxxxxx)');
      return;
    }

    setPasswordLoading(true);
    setPasswordError('');
    
    try {
      const result = await sendPasswordChangeOTP(passwordData.phoneNumber);
      if (result.status === 'success') {
        setPasswordMessage('تم إرسال رمز التحقق بنجاح');
        setPasswordStep(2);
        setOtpTimer(60);
      } else {
        setPasswordError(result.message || 'حدث خطأ في إرسال الرمز');
      }
    } catch (error) {
      setPasswordError('حدث خطأ في الاتصال. يرجى المحاولة مرة أخرى.');
    } finally {
      setPasswordLoading(false);
    }
  };

  // Verify OTP and proceed to password change
  const handleVerifyPasswordOTP = async () => {
    const otpString = passwordData.otp.join('');
    if (otpString.length !== 6) {
      setPasswordError('يرجى إدخال رمز التحقق كاملاً');
      return;
    }

    setPasswordLoading(true);
    setPasswordError('');

    try {
      const result = await verifyPasswordChangeOTP(passwordData.phoneNumber, otpString);
      
      if (result.status === 'success') {
        setPasswordMessage('تم التحقق من الرمز بنجاح');
        setPasswordStep(3);
      } else {
        setPasswordError(result.message || 'رمز التحقق غير صحيح');
      }
    } catch (error) {
      setPasswordError('حدث خطأ في التحقق من الرمز. يرجى المحاولة مرة أخرى.');
    } finally {
      setPasswordLoading(false);
    }
  };

  // Logout function
  const handleLogout = () => {
    // Use logout from AuthContext to clear all authentication data properly
    logout();
    
    // Navigate to login page
    navigate('/login');
  };

  // Change password
  const handleChangePassword = async () => {
    if (!passwordData.newPassword) {
      setPasswordError('يرجى إدخال كلمة المرور الجديدة');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setPasswordError('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError('كلمة المرور وتأكيد كلمة المرور غير متطابقين');
      return;
    }

    setPasswordLoading(true);
    setPasswordError('');

    try {
      const otpString = passwordData.otp.join('');
      const result = await changePasswordWithOTP(
        passwordData.phoneNumber,
        otpString,
        passwordData.newPassword
      );

      if (result.status === 'success') {
        setPasswordMessage('تم تغيير كلمة المرور بنجاح. سيتم تسجيل الخروج الآن...');
        
        // Wait 2 seconds then logout
        setTimeout(() => {
          handleLogout();
        }, 2000);
      } else {
        setPasswordError(result.message || 'حدث خطأ في تغيير كلمة المرور');
      }
    } catch (error) {
      setPasswordError('حدث خطأ في الاتصال. يرجى المحاولة مرة أخرى.');
    } finally {
      setPasswordLoading(false);
    }
  };

  // Debug log to check received data
  console.log('🔍 ProfileFilter received profileData:', profileData);
  return (
    <div className="ios-profile-card">
      {/* Header */}
      <div className="ios-header">
        <h2 className="ios-title">
          <FaUser className="ios-title-icon" />
          البروفايل الشخصي
        </h2>
      </div>

      {/* Main Card */}
      <div className="ios-main-card">
        {/* Profile Picture Card */}
        <div className="ios-picture-card">
          <div className="ios-profile-picture">
            <img src={uploadedImage || profileImage} alt="Profile" />
          </div>
          <input
            type="file"
            id="profile-image-upload"
            accept="image/*"
            onChange={handleImageChange}
            style={{ display: 'none' }}
          />
          <button 
            className="ios-change-btn"
            onClick={() => document.getElementById('profile-image-upload').click()}
          >
            <FaCamera className="ios-btn-icon" />
            تغيير الصورة
          </button>
        </div>

        {/* Info Card */}
        <div className="ios-info-card">
          <div className="ios-info-header">
            <FaUser className="ios-info-icon" />
            <h3 className="ios-info-title">المعلومات الشخصية</h3>
          </div>
          
          <div className="ios-info-list">
            <div className="ios-info-item">
              <div className="ios-item-label">
                <FaUser className="ios-icon" />
                الاسم الكامل
              </div>
              {isEditing ? (
                <input
                  type="text"
                  className="ios-item-input"
                  placeholder="اكتب الاسم الكامل"
                  value={profileData.fullName}
                  onChange={(e) => handleInputChange('fullName', e.target.value)}
                />
              ) : (
                <div className="ios-item-value">{profileData.fullName !== undefined && profileData.fullName !== null && profileData.fullName !== '' ? profileData.fullName : 'غير محدد'}</div>
              )}
            </div>
            
            <div className="ios-info-item">
              <div className="ios-item-label">
                <FaPhone className="ios-icon" />
                رقم الهاتف
              </div>
              {isEditing ? (
                <input
                  type="tel"
                  className="ios-item-input"
                  placeholder="اكتب رقم الهاتف"
                  value={profileData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                />
              ) : (
                <div className="ios-item-value">{profileData.phone !== undefined && profileData.phone !== null && profileData.phone !== '' ? profileData.phone : 'غير محدد'}</div>
              )}
            </div>
            
            <div className="ios-info-item">
              <div className="ios-item-label">
                <FaEnvelope className="ios-icon" />
                البريد الإلكتروني
              </div>
              <div className="ios-item-value ios-item-readonly">{profileData.email !== undefined && profileData.email !== null && profileData.email !== '' ? profileData.email : 'غير محدد'}</div>
            </div>
            
            <div className="ios-info-item">
              <div className="ios-item-label">
                <FaMapMarkerAlt className="ios-icon" />
                العنوان
              </div>
              {isEditing ? (
                <input
                  type="text"
                  className="ios-item-input"
                  placeholder="اكتب العنوان"
                  value={profileData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                />
              ) : (
                <div className="ios-item-value">{profileData.address !== undefined && profileData.address !== null && profileData.address !== '' ? profileData.address : 'غير محدد'}</div>
              )}
            </div>
            <div className="ios-info-item">
              <div className="ios-item-label">
                <FaMapMarkerAlt className="ios-icon" />
                المدينة
              </div>
              {isEditing ? (
                <input
                  type="text"
                  className="ios-item-input"
                  placeholder="اكتب المدينة"
                  value={profileData.city || ''}
                  onChange={(e) => handleInputChange('city', e.target.value)}
                />
              ) : (
                <div className="ios-item-value">{profileData.city !== undefined && profileData.city !== null && profileData.city !== '' ? profileData.city : 'غير محدد'}</div>
              )}
            </div>

            {/* Password Section */}
            <div className="ios-info-item">
              <div className="ios-item-label">
                <FaLock className="ios-icon" />
                كلمة المرور
              </div>
              <div className="ios-item-value ios-password-section">
                <span className="ios-password-stars">••••••••</span>
                <button 
                  className="ios-password-edit-btn"
                  onClick={handlePasswordSectionToggle}
                  title="تغيير كلمة المرور"
                >
                  <FaEdit className="ios-edit-icon" />
                </button>
              </div>
            </div>

          </div>
          
          {/* Password Change Modal */}
          {showPasswordSection && (
            <div className="ios-password-modal">
              <div className="ios-password-header">
                <FaKey className="ios-password-icon" />
                <h4 className="ios-password-title">تغيير كلمة المرور</h4>
                <button 
                  className="ios-password-close"
                  onClick={handlePasswordSectionToggle}
                >
                  ✕
                </button>
              </div>

              <div className="ios-password-content">
                {/* Step 1: Phone Number */}
                {passwordStep === 1 && (
                  <div className="ios-password-step">
                    <div className="ios-step-header">
                      <FaPhone className="ios-step-icon" />
                      <span className="ios-step-title">تأكيد رقم الهاتف</span>
                    </div>
                    <div className="ios-step-content">
                      <input
                        type="tel"
                        className="ios-password-input"
                        placeholder="05xxxxxxxx"
                        value={passwordData.phoneNumber}
                        onChange={(e) => handlePhoneChange(e.target.value)}
                        maxLength="10"
                      />
                      <button 
                        className="ios-password-btn"
                        onClick={handleSendPasswordOTP}
                        disabled={passwordLoading || !passwordData.phoneNumber}
                      >
                        {passwordLoading ? 'جاري الإرسال...' : 'إرسال رمز التحقق'}
                      </button>
                    </div>
                  </div>
                )}

                {/* Step 2: OTP Verification */}
                {passwordStep === 2 && (
                  <div className="ios-password-step">
                    <div className="ios-step-header">
                      <FaKey className="ios-step-icon" />
                      <span className="ios-step-title">رمز التحقق</span>
                    </div>
                    <div className="ios-step-content">
                      <p className="ios-otp-description">
                        تم إرسال رمز التحقق إلى {passwordData.phoneNumber}
                      </p>
                      <div className="ios-otp-container">
                        {passwordData.otp.map((digit, index) => (
                          <input
                            key={index}
                            id={`password-otp-${index}`}
                            type="text"
                            className="ios-otp-input"
                            value={digit}
                            onChange={(e) => handleOtpChange(index, e.target.value)}
                            onKeyDown={(e) => handleOtpKeyDown(index, e)}
                            maxLength="1"
                          />
                        ))}
                      </div>
                      <div className="ios-otp-actions">
                        <button 
                          className="ios-password-btn"
                          onClick={handleVerifyPasswordOTP}
                          disabled={passwordLoading || passwordData.otp.join('').length !== 6}
                        >
                          {passwordLoading ? 'جاري التحقق...' : 'تأكيد الرمز'}
                        </button>
                        {otpTimer > 0 ? (
                          <span className="ios-otp-timer">
                            إعادة الإرسال خلال {otpTimer} ثانية
                          </span>
                        ) : (
                          <button 
                            className="ios-resend-btn"
                            onClick={handleSendPasswordOTP}
                            disabled={passwordLoading}
                          >
                            إعادة إرسال الرمز
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 3: New Password */}
                {passwordStep === 3 && (
                  <div className="ios-password-step">
                    <div className="ios-step-header">
                      <FaLock className="ios-step-icon" />
                      <span className="ios-step-title">كلمة المرور الجديدة</span>
                    </div>
                    <div className="ios-step-content">
                      <div className="ios-password-field">
                        <input
                          type={showPassword ? "text" : "password"}
                          className="ios-password-input"
                          placeholder="كلمة المرور الجديدة"
                          value={passwordData.newPassword}
                          onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                        />
                        <button 
                          className="ios-password-toggle"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? <FaEyeSlash /> : <FaEye />}
                        </button>
                      </div>
                      <div className="ios-password-field">
                        <input
                          type={showConfirmPassword ? "text" : "password"}
                          className="ios-password-input"
                          placeholder="تأكيد كلمة المرور"
                          value={passwordData.confirmPassword}
                          onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                        />
                        <button 
                          className="ios-password-toggle"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        >
                          {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                        </button>
                      </div>
                      <button 
                        className="ios-password-btn"
                        onClick={handleChangePassword}
                        disabled={passwordLoading || !passwordData.newPassword || !passwordData.confirmPassword}
                      >
                        {passwordLoading ? 'جاري التغيير...' : 'تغيير كلمة المرور'}
                      </button>
                    </div>
                  </div>
                )}

                {/* Messages */}
                {passwordMessage && (
                  <div className="ios-password-message success">
                    {passwordMessage}
                  </div>
                )}
                {passwordError && (
                  <div className="ios-password-message error">
                    {passwordError}
                  </div>
                )}
              </div>
            </div>
          )}
          
          <div className="ios-btn-wrapper">
            <div className="ios-btn-divider"></div>
            <div className="ios-btn-group">
              {isEditing ? (
                <>
                  <button className="ios-cancel-btn" onClick={handleCancelEdit}>
                    <span className="ios-cancel-icon">✕</span>
                    إلغاء
                  </button>
                  <button className="ios-save-btn" onClick={handleEditToggle}>
                    <FaEdit className="ios-btn-icon" />
                    حفظ التغييرات
                  </button>
                </>
              ) : (
                <button className="ios-edit-btn" onClick={handleEditToggle}>
                  <FaEdit className="ios-btn-icon" />
                  تعديل البروفايل
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileFilter;

