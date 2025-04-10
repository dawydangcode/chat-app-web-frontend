import React, { useState } from 'react';
import Sidebar from '../components/Chat/Sidebar';
import ChatWindow from '../components/Chat/ChatWindow';
import '../assets/styles/ChatPage.css';

const ChatPage = () => {
  const [selectedChat, setSelectedChat] = useState(null);

  return (
    <div className="chat-page">
      <Sidebar onSelectChat={setSelectedChat} />
      {selectedChat ? (
        <ChatWindow chat={selectedChat} />
      ) : (
        <div className="no-chat-selected">
          <p>Chọn một cuộc trò chuyện để bắt đầu!</p>
        </div>
      )}
    </div>
  );
};

export default ChatPage;