import React from 'react';
import '../../assets/styles/MessageList.css';

const MessageList = ({ messages }) => {
  return (
    <div className="message-list">
      {messages.map((message) => (
        <div
          key={message.id}
          className={`message ${message.sender === 'Bạn' ? 'sent' : 'received'}`}
        >
          <p>{message.content}</p>
        </div>
      ))}
    </div>
  );
};

export default MessageList;