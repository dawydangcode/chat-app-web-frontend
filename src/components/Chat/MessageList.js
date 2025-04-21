import React from 'react';
import '../../assets/styles/ChatWindow.css';

const MessageList = ({ messages, recentChats, onRecallMessage, onDeleteMessage, onForwardMessage }) => {
  const currentUserId = JSON.parse(localStorage.getItem('user') || '{}')?.userId;

  return (
    <div className="message-list">
      {messages.map((message) => (
        <div
          key={message.id || message.messageId}
          className={`message ${
            message.senderId === currentUserId ? 'message-right' : 'message-left'
          }`}
        >
          <div className="message-content">
            {message.status === 'recalled' ? (
              <p>(Tin nhắn đã thu hồi)</p>
            ) : (
              <>
                {message.type === 'text' && <p>{message.content}</p>}
                {message.type === 'file' && (
                  <a href={message.mediaUrl} target="_blank" rel="noopener noreferrer">
                    {message.fileName || 'File'}
                  </a>
                )}
                <span className="message-time">
                  {new Date(message.timestamp).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </>
            )}
            {message.senderId === currentUserId && message.status !== 'recalled' && (
              <div className="message-actions">
                <button onClick={() => onRecallMessage(message.id || message.messageId)}>
                  Thu hồi
                </button>
                <button onClick={() => onDeleteMessage(message.id || message.messageId)}>
                  Xóa
                </button>
                <button
                  onClick={() => {
                    const targetUserId = prompt('Nhập ID người nhận để chuyển tiếp:');
                    if (targetUserId) {
                      onForwardMessage(message.id || message.messageId, targetUserId);
                    }
                  }}
                >
                  Chuyển tiếp
                </button>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default MessageList;