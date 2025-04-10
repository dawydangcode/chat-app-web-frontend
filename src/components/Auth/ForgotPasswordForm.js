import React, { useState } from 'react';
import { sendOTP } from '../../services/auth';
import '../../assets/styles/ForgotPassword.css';

const ForgotPasswordForm = ({ onSwitchToLogin, setPhoneNumber, onOTPSent }) => {
  const [phoneNumber, setLocalPhoneNumber] = useState('');
  const [error, setError] = useState('');

  const validatePhoneNumber = (phone) => {
    const phoneRegex = /^(0|\+?84)\d{9}$/;
    return phoneRegex.test(phone);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!phoneNumber) {
      setError('Số điện thoại không được để trống!');
      return;
    }

    if (!validatePhoneNumber(phoneNumber)) {
      setError('Số điện thoại sai định dạng! (Ví dụ: 0123456789, 84123456789, +84123456789)');
      return;
    }

    try {
      const response = await sendOTP(phoneNumber, 'reset-password');
      if (response.success) {
        setPhoneNumber(phoneNumber);
        onOTPSent(phoneNumber);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Gửi OTP thất bại!');
    }
  };

  return (
    <div className="forgot-password-form">
      <h2>Quên mật khẩu</h2>
      <form onSubmit={handleSubmit}>
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
        Quay lại{' '}
        <span className="link" onClick={onSwitchToLogin}>
          Đăng nhập
        </span>
      </p>
    </div>
  );
};

export default ForgotPasswordForm;