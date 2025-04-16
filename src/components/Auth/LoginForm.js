import React, { useState } from 'react';
import { login } from '../../services/auth';
import '../../assets/styles/Login.css';

const LoginForm = ({ onSwitchToRegister, onSwitchToForgotPassword, onLoginSuccess }) => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
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
      setError('Số điện thoại không đúng');
      return;
    }
    if (!password) {
      setError('Thiếu mật khẩu');
      return;
    }

    try {
      const response = await login(phoneNumber, password);
      if (response.success) {
        // Lưu token vào localStorage
        localStorage.setItem('token', response.token);

        // Lưu thông tin người dùng vào localStorage
        const userData = {
          userId: response.user.id, // Lưu userId
          name: response.user.name || '',
          phoneNumber: response.user.phoneNumber || '',
        };
        localStorage.setItem('user', JSON.stringify(userData));

        console.log('✅ Đã lưu user vào localStorage:', userData);

        // Gọi callback đăng nhập thành công
        onLoginSuccess();
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Đăng nhập thất bại!');
    }
  };

  return (
    <div className="login-form">
      <h2>Đăng nhập</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Số điện thoại</label>
          <input
            type="text"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            placeholder="Nhập số điện thoại"
          />
        </div>
        <div className="form-group">
          <label>Mật khẩu</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Nhập mật khẩu"
          />
        </div>
        {error && <p className="error">{error}</p>}
        <button type="submit">Đăng nhập</button>
      </form>
      <p>
        Chưa có tài khoản?{' '}
        <span className="link" onClick={onSwitchToRegister}>
          Đăng ký
        </span>
      </p>
      <p>
        Quên mật khẩu?{' '}
        <span className="link" onClick={onSwitchToForgotPassword}>
          Khôi phục
        </span>
      </p>
    </div>
  );
};

export default LoginForm;