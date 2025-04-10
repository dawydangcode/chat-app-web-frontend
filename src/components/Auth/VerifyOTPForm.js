import React, { useState, useEffect } from 'react';
import { verifyOTP, sendOTP } from '../../services/auth';
import '../../assets/styles/VerifyOTP.css';

const VerifyOTPForm = ({ phoneNumber, onOTPVerified, onSwitchToForgotPassword, onRegisterSuccess, registerData }) => {
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [resendTimer, setResendTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);

// Hàm khởi tạo bộ đếm
const startTimer = () => {
  setResendTimer(60);
  setCanResend(false);
};

useEffect(() => {
  if (resendTimer <= 0) {
    setCanResend(true);
    return;
  }

  const timer = setInterval(() => {
    setResendTimer((prev) => {
      if (prev <= 1) {
        setCanResend(true);
        clearInterval(timer);
        return 0;
      }
      return prev - 1;
    });
  }, 1000);

  return () => clearInterval(timer);
}, [resendTimer]); // Chạy lại useEffect khi resendTimer thay đổi

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!otp) {
      setError('OTP không được để trống!');
      return;
    }

    if (otp.length !== 6 || !/^\d{6}$/.test(otp)) {
      setError('OTP phải là 6 chữ số!');
      return;
    }
    console.log('Dữ liệu gửi lên API /api/auth/verify-otp:', { phoneNumber, otp });
    try {
      const response = await verifyOTP(phoneNumber, otp);
      if (response.success) {
        if (onRegisterSuccess) {
          if (!registerData) {
            setError('Dữ liệu đăng ký không hợp lệ! Vui lòng thử lại từ đầu.');
            return;
          }
          const updatedRegisterData = { ...registerData, otp }; // Thêm otp vào registerData
          onRegisterSuccess(updatedRegisterData);
        } else {
          onOTPVerified(otp);
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || 'OTP không hợp lệ hoặc đã hết hạn!');
    }
  };

  const handleResendOTP = async () => {
    setError('');
   startTimer();

    try {
      const purpose = registerData ? 'register' : 'reset-password';
      const response = await sendOTP(phoneNumber, purpose);
      if (response.success) {
        setError(''); // Xóa thông báo lỗi nếu gửi thành công
      }
    } catch (err) {
      setError(err.message || 'Gửi lại OTP thất bại! Vui lòng thử lại.');
    }
  };

  return (
    <div className="verify-otp-form">
      <h2>Xác nhận OTP</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Mã OTP</label>
          <input
            type="text"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            placeholder="Nhập mã OTP"
          />
        </div>
        {error && <p className="error">{error}</p>}
        <button type="submit">Xác nhận</button>
      </form>
      <p>
        {canResend ? (
          <span className="link" onClick={handleResendOTP}>
            Gửi lại mã OTP
          </span>
        ) : (
          `Gửi lại mã OTP sau ${resendTimer}s`
        )}
      </p>
      <p>
        Quay lại{' '}
        <span className="link" onClick={onSwitchToForgotPassword}>
          Quên mật khẩu
        </span>
      </p>
    </div>
  );
};

export default VerifyOTPForm;