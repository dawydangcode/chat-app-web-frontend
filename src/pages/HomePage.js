import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import LoginForm from '../components/Auth/LoginForm';
import RegisterForm from '../components/Auth/RegisterForm';
import ForgotPasswordForm from '../components/Auth/ForgotPasswordForm';
import VerifyOTPForm from '../components/Auth/VerifyOTPForm';
import ResetPasswordForm from '../components/Auth/ResetPasswordForm';
import '../assets/styles/HomePage.css';
import logo from '../assets/images/logo.png';
const HomePage = () => {
  const [currentForm, setCurrentForm] = useState('login');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isRegisterFlow, setIsRegisterFlow] = useState(false);
  const [registerData, setRegisterData] = useState(null);
  const [otp, setOtp] = useState('');
  const navigate = useNavigate();

  const handleFormSwitch = (form) => {
    setCurrentForm(form);
  };

  const handleOTPVerifiedForForgotPassword = (otpValue) => {
    setOtp(otpValue); // Lưu otp
    setCurrentForm('resetPassword');
  };
  console.log("Phone"+phoneNumber);
  
  const handleOTPVerifiedForRegister = (updatedRegisterData) => {
    setRegisterData(updatedRegisterData); // Cập nhật registerData với otp
    setCurrentForm('resetPassword');
    setIsRegisterFlow(true);
  };

  const handleSuccess = () => {
    navigate('/chat');
  };

  const handleResetPasswordSuccess = () => {
    setCurrentForm('login');
    setIsRegisterFlow(false);
    setRegisterData(null);
    setOtp(''); // Xóa otp sau khi hoàn tất
  };

  const handleOTPSent = (phone) => {
    setPhoneNumber(phone);
    setCurrentForm('verifyOTP');
  };

  return (
    <div className="home-page">
      <div className="home-header">
      <img src={logo} alt="Zalo Logo" className="logo" />
        <h1>Chào mừng đến với Zalu</h1>
      </div>
      <div className="form-container">
        {currentForm === 'login' && (
          <LoginForm
            onSwitchToRegister={() => handleFormSwitch('register')}
            onSwitchToForgotPassword={() => handleFormSwitch('forgotPassword')}
            onLoginSuccess={handleSuccess}
          />
        )}
        {currentForm === 'register' && (
          <RegisterForm
            onSwitchToLogin={() => handleFormSwitch('login')}
            setPhoneNumber={setPhoneNumber}
            onRegisterSuccess={(data) => {
              setRegisterData(data);
              setIsRegisterFlow(true);
              handleOTPSent(data.phoneNumber);
            }}
          />
        )}
        {currentForm === 'forgotPassword' && (
          <ForgotPasswordForm
            onSwitchToLogin={() => handleFormSwitch('login')}
            setPhoneNumber={setPhoneNumber}
            onOTPSent={handleOTPSent}
          />
        )}
        {currentForm === 'verifyOTP' && (
          <VerifyOTPForm
            phoneNumber={phoneNumber}
            onOTPVerified={
              isRegisterFlow
                ? handleOTPVerifiedForRegister
                : handleOTPVerifiedForForgotPassword
            }
            onSwitchToForgotPassword={() => handleFormSwitch('forgotPassword')}
            onRegisterSuccess={isRegisterFlow ? handleOTPVerifiedForRegister : undefined}
            registerData={registerData}
          />
        )}
        {currentForm === 'resetPassword' && (
          <ResetPasswordForm
            phoneNumber={phoneNumber}
            onResetPasswordSuccess={
              isRegisterFlow ? handleSuccess : handleResetPasswordSuccess
            }
            isRegisterFlow={isRegisterFlow}
            registerData={registerData}
            otp={otp}
          />
        )}
      </div>
    </div>
  );
};

export default HomePage;