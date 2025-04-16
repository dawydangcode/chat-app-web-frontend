import React, { useState } from 'react';
import '../../assets/styles/MessageInput.css';

const MessageInput = ({ onSendMessage }) => {
  const [message, setMessage] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('📤 Form submitted, message:', message);
    if (message.trim()) {
      console.log('📩 Gọi onSendMessage với:', message);
      onSendMessage(message);
      setMessage('');
    } else {
      console.log('⚠️ Tin nhắn rỗng, không gửi');
    }
  };

  return (
    <div className="message-input">
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Nhập tin nhắn..."
        />
        <button type="submit">Gửi</button>
        <button type="button">📷</button>
        <button type="button">📁</button>
        <button type="button">😊</button>
      </form>
    </div>
  );
};

export default MessageInput;