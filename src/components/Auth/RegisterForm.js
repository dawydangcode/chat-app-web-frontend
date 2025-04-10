import React, { useState } from 'react';
import { sendOTP } from '../../services/auth';
import '../../assets/styles/Register.css';

const RegisterForm = ({ onSwitchToLogin, setPhoneNumber, onRegisterSuccess }) => {
  const [name, setName] = useState('');
  const [phoneNumber, setLocalPhoneNumber] = useState('');
  const [error, setError] = useState('');

  const validatePhoneNumber = (phone) => {
    const phoneRegex = /^(0|\+?84)\d{9}$/;
    return phoneRegex.test(phone);
  };

  const capitalizeName = (name) => {
    return name
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!name ) {
      setError('Tên không được để trống!');
      return;
    }
    if ( !phoneNumber) {
      setError('Số điện thoại không được để trống!');
      return;
    }

    if (!validatePhoneNumber(phoneNumber)) {
      setError('Sai số điện thoại');
      return;
    }

    try {
      
      const response = await sendOTP(phoneNumber, 'register');
      console.log('Phản hồi từ API /api/auth/send-otp:', response);
      if (response.success) {
        setPhoneNumber(phoneNumber);
        onRegisterSuccess({ name, phoneNumber }); // Truyền thông tin name và phoneNumber
      
      }
    } catch (err) {
      
      if (err.response && err.response.status === 400 && err.response.data.message === 'Số điện thoại đã được đăng ký!') {
         setError('Số điện thoại đã được đăng ký!');
      } else {
         setError(err.response?.data?.message||'Gửi OTP thất bại! Vui lòng thử lại.');
      }
    }
  };

  return (
    <div className="register-form">
      <h2>Đăng ký</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Tên người dùng</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(capitalizeName(e.target.value))}
            placeholder="Nhập tên của bạn"
          />
        </div>
        <div className="form-group">
          <label>Số điện thoại</label>
          <input
            type="text"
            value={phoneNumber}
            onChange={(e) => setLocalPhoneNumber(e.target.value)}
            placeholder="Nhập số điện thoại"
          />
        </div>
        {error && <p className="error">{error}</p>}
        <button type="submit">Gửi mã OTP</button>
      </form>
      <p>
        Đã có tài khoản?{' '}
        <span className="link" onClick={onSwitchToLogin}>
          Đăng nhập
        </span>
      </p>
    </div>
  );
};

export default RegisterForm;