import React, { useState } from 'react';
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
  const [userProfile, setUserProfile] = useState({
    name: 'User Name',
    avatar: '/assets/images/avatar.png',
  });
  const [isInfoVisible, setIsInfoVisible] = useState(true);

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