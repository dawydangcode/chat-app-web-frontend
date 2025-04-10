import React, { useState } from 'react';
import { resetPassword } from '../../services/auth';
import axios from 'axios';
import '../../assets/styles/ResetPassword.css';

const ResetPasswordForm = ({ phoneNumber, onResetPasswordSuccess, isRegisterFlow, registerData,otp }) => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');

  const validatePassword = (pwd) => {
    const hasNumber = /[0-9]/.test(pwd);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(pwd);
    const hasUpperCase = /[A-Z]/.test(pwd);
    const hasLowerCase = /[a-z]/.test(pwd);
    return pwd.length >= 10 && hasNumber && hasSpecialChar && hasUpperCase && hasLowerCase;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!validatePassword(password)) {
      setError('Mật khẩu phải dài hơn hoặc bằng 10 ký tự, chứa số, ký tự đặc biệt, chữ hoa, chữ thường!');
      return;
    }

    if (password !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp!');
      return;
    }

    
      if (isRegisterFlow) {
        // Luồng đăng ký
        // Kiểm tra dữ liệu trước khi gửi API
        console.log('registerData:', registerData);
        console.log('registerData.phoneNumber:', registerData?.phoneNumber);
        console.log('registerData.name:', registerData?.name);
        console.log('password:', password);
        console.log('registerData.otp:', registerData?.otp);
        if (!registerData?.phoneNumber) {
          setError('Thiếu số điện thoại!');
          return;
        }
        if (!registerData?.name) {
          setError('Thiếu tên người dùng!');
          return;
        }
        if (!password) {
          setError('Thiếu mật khẩu!');
          return;
        }
        if (!registerData?.otp) {
          setError('Thiếu mã OTP!');
          return;
        }
        try {
        const response = await axios.post('http://localhost:3000/api/auth/register', {
          phoneNumber: registerData.phoneNumber,
          name: registerData.name,
          password,
          otp: registerData.otp,
        });
        if (response.data.success) {
          localStorage.setItem('token', response.data.token);
          onResetPasswordSuccess();
        }
        } catch (err) {
          if (err.response && err.response.status === 400 && err.response.data.message === 'Số điện thoại đã được đăng ký!') {
            setError('Số điện thoại đã được đăng ký!');
          } else
            setError(err.response?.data?.message || 'Thao tác thất bại! Vui lòng thử lại.');
        }
        
      } else {
        // Luồng quên mật khẩu
      
      console.log('phoneNumber:', phoneNumber);
      console.log('password:', password);
      console.log('otp:', otp);

      if (!phoneNumber) {
        setError('Thiếu số điện thoại!');
        return;
      }
      if (!password) {
        setError('Thiếu mật khẩu!');
        return;
      }
      if (!otp) {
        setError('Thiếu mã OTP!');
        return;
      }

      try {
        const response = await resetPassword(phoneNumber, password, otp);
        if (response.success) {
          onResetPasswordSuccess();
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Thao tác thất bại! Vui lòng thử lại.');
      }
      }
   
  };

  return (
    <div className="reset-password-form">
      <h2>{isRegisterFlow ? 'Tạo mật khẩu' : 'Đặt lại mật khẩu'}</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Mật khẩu mới</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Nhập mật khẩu mới"
          />
        </div>
        <div className="form-group">
          <label>Xác nhận mật khẩu</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Xác nhận mật khẩu"
          />
        </div>
        {error && <p className="error">{error}</p>}
        <button type="submit">Xác nhận</button>
      </form>
    </div>
  );
};

export default ResetPasswordForm;