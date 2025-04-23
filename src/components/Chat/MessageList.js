import React, { useState } from 'react';
import '../../assets/styles/ChatWindow.css';
import '../../assets/styles/MessageList.css';
import { FaUndo, FaTrash, FaShare } from 'react-icons/fa';

const MessageList = ({ messages, recentChats, onRecallMessage, onDeleteMessage, onForwardMessage, chat }) => {
  const currentUserId = JSON.parse(localStorage.getItem('user') || '{}')?.userId;
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [messageToDelete, setMessageToDelete] = useState(null);
  const [fullscreenMedia, setFullscreenMedia] = useState(null);
  const [mediaLoadError, setMediaLoadError] = useState(null);

  const handleDeleteClick = (messageId) => {
    setMessageToDelete(messageId);
    setShowDeleteModal(true);
  };

  const confirmDelete = () => {
    if (messageToDelete) {
      onDeleteMessage(messageToDelete);
    }
    setShowDeleteModal(false);
    setMessageToDelete(null);
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
    setMessageToDelete(null);
  };

  const handleMediaClick = (mediaUrl, mimeType) => {
    setFullscreenMedia({ mediaUrl, mimeType });
  };

  const closeFullscreen = () => {
    setFullscreenMedia(null);
  };

  const handleMediaError = (messageId) => {
    setMediaLoadError(messageId);
  };

  if (!Array.isArray(messages)) {
    console.error('Messages prop is not an array:', messages);
    return <div>Đã xảy ra lỗi khi tải tin nhắn. Vui lòng thử lại.</div>;
  }

  let lastSenderId = null;

  return (
    <div className="message-list">
      {messages.map((message, index) => {
        const isCurrentUser = message.senderId === currentUserId;
        const isSameSenderAsPrevious = lastSenderId === message.senderId;
        const nextMessage = messages[index + 1];
        const isSameSenderAsNext = nextMessage && nextMessage.senderId === message.senderId;
        const showTime = !isSameSenderAsNext || index === messages.length - 1;
        const showAvatarAndName = !isCurrentUser && (!isSameSenderAsPrevious || index === 0);
        const isMediaMessage = (message.type === 'image' || message.type === 'video') && message.mediaUrl;
        lastSenderId = message.senderId;

        return (
          <div
            key={message.id || message.messageId}
            className={`message ${isCurrentUser ? 'message-right' : 'message-left'} ${isMediaMessage ? 'media-message' : ''}`}
          >
            {showAvatarAndName && (
              <div className="message-sender-info">
                <img
                  src={
                    chat?.isGroup
                      ? message.sender?.avatar || '/assets/images/placeholder.png'
                      : chat?.avatar || '/assets/images/placeholder.png'
                  }
                  alt="Sender Avatar"
                  className="message-sender-avatar"
                />
              </div>
            )}
            {!showAvatarAndName && !isCurrentUser && (
              <div className="message-sender-info-placeholder" />
            )}

            <div className="message-content-wrapper">
              {message.status === 'recalled' ? (
                <div className="message-content">
                  <p>(Tin nhắn đã thu hồi)</p>
                </div>
              ) : (
                <>
                  {chat?.isGroup && showAvatarAndName && isMediaMessage && (
                    <span className="message-sender-name">
                      {message.sender?.name || 'Không có tên'}
                    </span>
                  )}
                  {isMediaMessage ? (
                    <div className="media-message-container">
                      {message.mimeType?.startsWith('image/') || message.type === 'image' ? (
                        mediaLoadError === (message.id || message.messageId) ? (
                          <div className="media-error">
                            <p>Không thể tải hình ảnh: {message.fileName || 'Image'}</p>
                            <a href={message.mediaUrl} target="_blank" rel="noopener noreferrer">
                              Tải xuống
                            </a>
                          </div>
                        ) : (
                          <img
                            src={message.mediaUrl}
                            alt={message.fileName || 'Image'}
                            onClick={() => handleMediaClick(message.mediaUrl, message.mimeType)}
                            onError={() => handleMediaError(message.id || message.messageId)}
                            style={{ cursor: 'pointer' }}
                          />
                        )
                      ) : message.mimeType?.startsWith('video/') || message.type === 'video' ? (
                        <video
                          controls
                          onClick={() => handleMediaClick(message.mediaUrl, message.mimeType)}
                          onError={() => handleMediaError(message.id || message.messageId)}
                          style={{ cursor: 'pointer' }}
                        >
                          <source src={message.mediaUrl} type={message.mimeType} />
                          Trình duyệt của bạn không hỗ trợ video.
                        </video>
                      ) : null}
                    </div>
                  ) : (
                    <div className="message-content">
                      {chat?.isGroup && showAvatarAndName && !isMediaMessage && (
                        <span className="message-sender-name-inline">
                          {message.sender?.name || 'Không có tên'}
                        </span>
                      )}
                      {message.type === 'text' && <p>{message.content}</p>}
                      {(message.type === 'file' || message.type === 'pdf' || message.type === 'zip') && message.mediaUrl ? (
                        <div className="media-container">
                          <a href={message.mediaUrl} target="_blank" rel="noopener noreferrer">
                            {message.fileName || 'File'}
                          </a>
                        </div>
                      ) : (
                        message.type !== 'text' && !message.mediaUrl && (
                          <p>Không thể hiển thị file: {message.fileName || 'Unknown'}</p>
                        )
                      )}
                      {message.status === 'error' && message.errorMessage && (
                        <p className="error-message">{message.errorMessage}</p>
                      )}
                    </div>
                  )}
                  <div className="message-meta">
                    {showTime && (
                      <span className="message-time">
                        {new Date(message.timestamp).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    )}
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
              <div className="message-actions">
                {isCurrentUser && message.status !== 'recalled' && (
                  <button onClick={() => onRecallMessage(message.id || message.messageId)}>
                    <FaUndo />
                  </button>
                )}
                <button onClick={() => handleDeleteClick(message.id || message.messageId)}>
                  <FaTrash />
                </button>
                {message.status !== 'recalled' && (
                  <button
                    onClick={() => {
                      const targetUserId = prompt('Nhập ID người nhận để chuyển tiếp:');
                      if (targetUserId) {
                        onForwardMessage(message.id || message.messageId, targetUserId);
                      }
                    }}
                  >
                    <FaShare />
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })}

      {showDeleteModal && (
        <div className="delete-modal">
          <div className="delete-modal-content">
            <p>Tin nhắn chỉ xóa ở phía tôi</p>
            <div className="delete-modal-actions">
              <button onClick={confirmDelete} className="confirm-btn">
                Đồng ý
              </button>
              <button onClick={cancelDelete} className="cancel-btn">
                Hủy
              </button>
            </div>
          </div>
        </div>
      )}

      {fullscreenMedia && (
        <div className="fullscreen-media-modal" onClick={closeFullscreen}>
          <div className="fullscreen-media-content">
            {fullscreenMedia.mimeType.startsWith('image/') ? (
              <img src={fullscreenMedia.mediaUrl} alt="Fullscreen Media" />
            ) : (
              <video controls autoPlay>
                <source src={fullscreenMedia.mediaUrl} type={fullscreenMedia.mimeType} />
                Trình duyệt của bạn không hỗ trợ video.
              </video>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default MessageList;