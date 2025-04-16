import axios from 'axios';

const API_URL = 'http://localhost:3001/api';

export const getMessagesSummary = async () => {
  const response = await axios.get(`${API_URL}/messages/summary`, {
    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
  });
  return response.data;
};

export const getContacts = async () => {
  const response = await axios.get(`${API_URL}/contacts`, {
    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
  });
  return response.data;
};

export const getUserProfile = async () => {
  const response = await axios.get(`${API_URL}/auth/profile`, {
    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
  });
  return response.data;
};