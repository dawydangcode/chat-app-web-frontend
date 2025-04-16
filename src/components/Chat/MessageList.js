import React from 'react';
import '../../assets/styles/MessageList.css';

const MessageList = ({ messages }) => {
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  const currentUserId = currentUser?.userId;

  console.log('Messages in MessageList:', messages);
  console.log('Current User ID:', currentUserId);

  if (!currentUserId) {
    console.log('⚠️ currentUserId không tồn tại');
    return <div className="message-list"><p>Lỗi: Không xác định được người dùng. Vui lòng đăng nhập lại.</p></div>;
  }

  if (!messages || messages.length === 0) {
    return <div className="message-list"><p>Chưa có tin nhắn nào</p></div>;
  }

  return (
    <div className="message-list">
      {messages.map((msg) => (
        <div
          key={msg.messageId || msg.id}
          className={`message ${msg.senderId === currentUserId ? 'sent' : 'received'}`}
        >
          <p>{msg.content}</p>
          <span>{new Date(msg.timestamp).toLocaleTimeString()}</span>
        </div>
      ))}
    </div>
  );
};

export default MessageList;