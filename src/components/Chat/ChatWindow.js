import React, { useState } from 'react';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import '../../assets/styles/ChatWindow.css';

const ChatWindow = ({ chat }) => {
  const [messages, setMessages] = useState([
    { id: 1, sender: 'Nguyễn Văn A', content: 'Chào bạn!' },
    { id: 2, sender: 'Bạn', content: 'Chào!' },
  ]);

  const handleSendMessage = (content) => {
    setMessages([...messages, { id: messages.length + 1, sender: 'Bạn', content }]);
  };

  return (
    <div className="chat-window">
      <div className="chat-header">
        <h3>{chat.name}</h3>
      </div>
      <MessageList messages={messages} />
      <MessageInput onSendMessage={handleSendMessage} />
    </div>
  );
};

export default ChatWindow;