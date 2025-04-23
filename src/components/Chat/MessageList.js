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

  // Nhóm các tin nhắn ảnh liên tiếp của cùng một người gửi
  const groupedMessages = [];
  let currentGroup = [];
  let lastSenderId = null;
  let lastTimestamp = null;

  messages.forEach((message, index) => {
    const isCurrentUser = message.senderId === currentUserId;
    const nextMessage = messages[index + 1];
    const isSameSenderAsPrevious = lastSenderId === message.senderId;
    const isMediaMessage = (message.type === 'image' || message.type === 'video') && message.mediaUrl;
    const isImageMessage = message.type === 'image' && message.mediaUrl;

    // Tính khoảng cách thời gian giữa tin nhắn hiện tại và tin nhắn trước đó
    const currentTimestamp = new Date(message.timestamp).getTime();
    const timeDifference = lastTimestamp ? (currentTimestamp - lastTimestamp) / 1000 : Infinity; // Chuyển sang giây
    const timeThreshold = 15; // Ngưỡng 1 phút (60 giây)

    // Nếu tin nhắn là ảnh, cùng người gửi, và khoảng cách thời gian nhỏ hơn ngưỡng
    if (isImageMessage && isSameSenderAsPrevious && timeDifference <= timeThreshold) {
      currentGroup.push(message);
    } else {
      // Nếu không phải ảnh, không cùng người gửi, hoặc vượt ngưỡng thời gian, đóng nhóm hiện tại (nếu có)
      if (currentGroup.length > 0) {
        groupedMessages.push({ type: 'image-group', messages: currentGroup, senderId: lastSenderId });
        currentGroup = [];
      }
      // Nếu tin nhắn hiện tại là ảnh, bắt đầu nhóm mới
      if (isImageMessage) {
        currentGroup.push(message);
      } else {
        // Nếu không phải ảnh, thêm tin nhắn riêng lẻ
        groupedMessages.push(message);
      }
    }

    // Nếu đây là tin nhắn cuối cùng, đóng nhóm (nếu có)
    if (index === messages.length - 1 && currentGroup.length > 0) {
      groupedMessages.push({ type: 'image-group', messages: currentGroup, senderId: lastSenderId });
    }

    lastSenderId = message.senderId;
    lastTimestamp = currentTimestamp;
  });

  return (
    <div className="message-list">
      {groupedMessages.map((group, groupIndex) => {
        const isGroupMessage = group.type === 'image-group';
        const groupMessages = isGroupMessage ? group.messages : [group];
        const firstMessage = groupMessages[0];
        const lastMessage = groupMessages[groupMessages.length - 1];
        const isCurrentUser = firstMessage.senderId === currentUserId;
        const prevGroup = groupedMessages[groupIndex - 1];
        const nextGroup = groupedMessages[groupIndex + 1];
        const isSameSenderAsPrevious = prevGroup && (prevGroup.senderId === firstMessage.senderId || (prevGroup.type === 'image-group' && prevGroup.senderId === firstMessage.senderId));
        const isSameSenderAsNext = nextGroup && (nextGroup.senderId === lastMessage.senderId || (nextGroup.type === 'image-group' && nextGroup.senderId === lastMessage.senderId));
        const showTime = !isSameSenderAsNext || groupIndex === groupedMessages.length - 1;
        const showAvatarAndName = !isCurrentUser && (!isSameSenderAsPrevious || groupIndex === 0);

        return (
          <div
            key={groupIndex}
            className={`message ${isCurrentUser ? 'message-right' : 'message-left'} ${isGroupMessage ? 'media-message' : ''}`}
          >
            {showAvatarAndName && (
              <div className="message-sender-info">
                <img
                  src={
                    chat?.isGroup
                      ? firstMessage.sender?.avatar || '/assets/images/placeholder.png'
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
              {firstMessage.status === 'recalled' ? (
                <div className="message-content">
                  <p>(Tin nhắn đã thu hồi)</p>
                </div>
              ) : (
                <>
                  {chat?.isGroup && showAvatarAndName && isGroupMessage && (
                    <span className="message-sender-name">
                      {firstMessage.sender?.name || 'Không có tên'}
                    </span>
                  )}
                  {isGroupMessage ? (
                    // Nhóm ảnh
                    <div className="media-message-group">
                      {groupMessages.map((message, idx) => (
                        <div key={message.id || message.messageId} className="media-message-container">
                          {mediaLoadError === (message.id || message.messageId) ? (
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
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    // Tin nhắn không phải ảnh hoặc video
                    <div className="message-content">
                      {chat?.isGroup && showAvatarAndName && !isGroupMessage && (
                        <span className="message-sender-name-inline">
                          {firstMessage.sender?.name || 'Không có tên'}
                        </span>
                      )}
                      {firstMessage.type === 'text' && <p>{firstMessage.content}</p>}
                      {(firstMessage.type === 'video') && firstMessage.mediaUrl ? (
                        <div className="media-message-container">
                          <video
                            controls
                            onClick={() => handleMediaClick(firstMessage.mediaUrl, firstMessage.mimeType)}
                            onError={() => handleMediaError(firstMessage.id || firstMessage.messageId)}
                            style={{ cursor: 'pointer' }}
                          >
                            <source src={firstMessage.mediaUrl} type={firstMessage.mimeType} />
                            Trình duyệt của bạn không hỗ trợ video.
                          </video>
                        </div>
                      ) : null}
                      {(firstMessage.type === 'file' || firstMessage.type === 'pdf' || firstMessage.type === 'zip') && firstMessage.mediaUrl ? (
                        <div className="media-container">
                          <a href={firstMessage.mediaUrl} target="_blank" rel="noopener noreferrer">
                            {firstMessage.fileName || 'File'}
                          </a>
                        </div>
                      ) : (
                        firstMessage.type !== 'text' && !firstMessage.mediaUrl && (
                          <p>Không thể hiển thị file: {firstMessage.fileName || 'Unknown'}</p>
                        )
                      )}
                      {firstMessage.status === 'error' && firstMessage.errorMessage && (
                        <p className="error-message">{firstMessage.errorMessage}</p>
                      )}
                    </div>
                  )}
                  <div className="message-meta">
                    {showTime && (
                      <span className="message-time">
                        {new Date(lastMessage.timestamp).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    )}
                    {isCurrentUser && (
                      <span className={`message-status ${lastMessage.status}`}>
                        {lastMessage.status === 'pending' && 'Đang gửi...'}
                        {lastMessage.status === 'sent' && '✓'}
                        {lastMessage.status === 'delivered' && '✓✓'}
                        {lastMessage.status === 'seen' && 'Đã xem'}
                        {lastMessage.status === 'error' && 'Lỗi'}
                      </span>
                    )}
                  </div>
                </>
              )}
              <div className="message-actions">
                {isCurrentUser && lastMessage.status !== 'recalled' && (
                  <button onClick={() => onRecallMessage(lastMessage.id || lastMessage.messageId)}>
                    <FaUndo />
                  </button>
                )}
                <button onClick={() => handleDeleteClick(lastMessage.id || lastMessage.messageId)}>
                  <FaTrash />
                </button>
                {lastMessage.status !== 'recalled' && (
                  <button
                    onClick={() => {
                      const targetUserId = prompt('Nhập ID người nhận để chuyển tiếp:');
                      if (targetUserId) {
                        onForwardMessage(lastMessage.id || lastMessage.messageId, targetUserId);
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