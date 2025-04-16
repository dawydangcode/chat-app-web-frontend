import axios from 'axios';

const API_URL = 'http://localhost:3000/api/auth';

export const login = async (phoneNumber, password) => {
  const response = await axios.post(`${API_URL}/login`, { phoneNumber, password });
  return response.data;
};

export const sendOTP = async (phoneNumber, purpose) => {
  const response = await axios.post(`${API_URL}/send-otp`, { phoneNumber, purpose });
  return response.data;
};

export const verifyOTP = async (phoneNumber, otp) => {
  const response = await axios.post(`${API_URL}/verify-otp`, { phoneNumber, otp });
  return response.data;
};

export const resetPassword = async (phoneNumber, newPassword, otp) => {
  const response = await axios.post(`${API_URL}/reset-password`, { phoneNumber, newPassword, otp });
  return response.data;
};

export const logout = async () => {
  await axios.post(
    `${API_URL}/logout`, // Sửa từ port 3001 sang 3000
    {},
    {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
    }
  );
  return { success: true };
};