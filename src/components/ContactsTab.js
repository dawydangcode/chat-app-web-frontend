import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import '../assets/styles/Sidebar.css';

const ContactsTab = () => {
  const [contacts, setContacts] = useState([]);
  const navigate = useNavigate();
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  const currentUserId = currentUser?.userId;

  const fetchContacts = async () => {
    if (!currentUserId) {
      navigate('/login');
      return;
    }

    const token = localStorage.getItem('token');
    try {
      const response = await axios.get('http://localhost:3000/api/contacts', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setContacts(response.data);
    } catch (error) {
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
      }
    }
  };

  useEffect(() => {
    fetchContacts();
  }, [navigate, currentUserId]);

  return (
    <div className="contacts">
      <h3>Danh sách bạn bè</h3>
      {contacts.map((contact) => (
        <div key={contact.id} className="contact-item">
          <p>{contact.name}</p>
          <p className="contact-phone">{contact.phoneNumber}</p>
        </div>
      ))}
    </div>
  );
};

export default ContactsTab;