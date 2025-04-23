import React from 'react';
import '../../assets/styles/ChatWindow.css';

const MessageList = ({ messages, recentChats, onRecallMessage, onDeleteMessage, onForwardMessage, chat }) => {
  const currentUserId = JSON.parse(localStorage.getItem('user') || '{}')?.userId;
  let lastSenderId = null; // Theo dõi người gửi trước đó để tránh lặp avatar/tên

  return (
    <div className="message-list">
      {messages.map((message, index) => {
        const isCurrentUser = message.senderId === currentUserId;
        const isSameSenderAsPrevious = lastSenderId === message.senderId;
        lastSenderId = message.senderId; // Cập nhật người gửi trước đó

        // Xác định xem có nên hiển thị avatar và tên không
        const showAvatarAndName = !isCurrentUser && (!isSameSenderAsPrevious || index === 0);

        return (
          <div
            key={message.id || message.messageId}
            className={`message ${isCurrentUser ? 'message-right' : 'message-left'}`}
          >
            {/* Hiển thị avatar và tên (nếu cần) */}
            {showAvatarAndName && (
              <div className="message-sender-info">
                {/* Avatar: Với chat đơn thì dùng avatar của targetUserId, với nhóm thì dùng avatar của sender */}
                <img
                  src={
                    chat?.isGroup
                      ? message.sender?.avatar || '/assets/images/placeholder.png'
                      : chat?.avatar || '/assets/images/placeholder.png'
                  }
                  alt="Sender Avatar"
                  className="message-sender-avatar"
                />
                {/* Tên: Chỉ hiển thị trong nhóm chat */}
                {chat?.isGroup && (
                  <span className="message-sender-name">
                    {message.sender?.name || 'Không có tên'}
                  </span>
                )}
              </div>
            )}
            {/* Nếu không hiển thị avatar, để một khoảng trống để căn chỉnh */}
            {!showAvatarAndName && !isCurrentUser && (
              <div className="message-sender-info-placeholder" />
            )}

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
                  <div className="message-meta">
                    <span className="message-time">
                      {new Date(message.timestamp).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                    {isCurrentUser && (
                      <span className={`message-status ${message.status}`}>
                        {message.status === 'pending' && 'Đang gửi...'}
                        {message.status === 'sent' && '✓'}
                        {message.status === 'delivered' && '✓✓'}
                        {message.status === 'seen' && 'Đã xem'}
                        {message.status === 'error' && 'Lỗi'}
                      </span>
                    )}
                  </div>
                </>
              )}
              {isCurrentUser && message.status !== 'recalled' && (
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
        );
      })}
    </div>
  );
};

export default MessageList;