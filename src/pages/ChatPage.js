import React, { useState, useEffect } from 'react';
import axios from 'axios';
import SidebarHeader from '../components/Chat/SidebarHeader';
import MessagesTab from '../components/Chat/MessageTab';
import ChatWindow from '../components/Chat/ChatWindow';
import ConversationInfo from '../components/Chat/ConversationInfo';
import SettingsTab from '../components/SettingTab';
import ContactsTab from '../components/ContactsTab';
import '../assets/styles/ChatPage.css';

const ChatPage = () => {
  const [activeTab, setActiveTab] = useState('messages');
  const [selectedChat, setSelectedChat] = useState(null);
  const [isInfoVisible, setIsInfoVisible] = useState(true);
  const [userProfile, setUserProfile] = useState({
    name: '',
    avatar: null,
  });

  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  const currentUserId = currentUser?.userId;

  // Lấy thông tin user từ API giống như trong SettingsTab
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!currentUserId) {
        window.location.href = '/login';
        return;
      }

      const token = localStorage.getItem('token');
      if (!token || !token.startsWith('eyJ')) {
        window.location.href = '/login';
        return;
      }

      try {
        const response = await axios.get('http://localhost:3000/api/auth/profile', {
          headers: { Authorization: `Bearer ${token.trim()}` },
        });
        const profileData = {
          name: response.data.data.name || 'User Name',
          avatar: response.data.data.avatar || '/assets/images/avatar.png',
        };
        setUserProfile(profileData);

        // Cập nhật localStorage để đồng bộ dữ liệu
        const updatedUser = {
          ...currentUser,
          name: response.data.data.name,
          avatar: response.data.data.avatar,
        };
        localStorage.setItem('user', JSON.stringify(updatedUser));
      } catch (error) {
        if (error.response?.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.href = '/login';
        }
      }
    };

    fetchUserProfile();
  }, [currentUserId]);

  const handleSelectChat = (chat) => {
    setSelectedChat(chat);
  };

  const toggleInfo = () => {
    setIsInfoVisible((prev) => !prev);
  };

  return (
    <div className="parent">
      <div className="div1">
        <SidebarHeader
          userProfile={userProfile}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
        />
      </div>
      <div className="div2">
        {activeTab === 'messages' && (
          <MessagesTab onSelectChat={handleSelectChat} />
        )}
        {activeTab === 'contacts' && <ContactsTab />}
        {activeTab === 'settings' && <SettingsTab />}
      </div>
      <div className={`div3 ${!isInfoVisible ? 'expanded' : ''}`}>
        {selectedChat ? (
          <ChatWindow
            chat={selectedChat}
            toggleInfo={toggleInfo}
            isInfoVisible={isInfoVisible}
          />
        ) : (
          <div className="no-chat-selected">
            <p>Chọn một cuộc trò chuyện để bắt đầu!</p>
          </div>
        )}
      </div>
      {isInfoVisible && (
        <div className="div4">
          {selectedChat && <ConversationInfo chat={selectedChat} />}
        </div>
      )}
    </div>
  );
};

export default ChatPage;