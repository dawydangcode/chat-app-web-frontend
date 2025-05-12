import React, { useState, useEffect, useRef } from 'react';
import '../../assets/styles/ChatWindow.css';
import '../../assets/styles/MessageList.css';
import { FaUndo, FaTrash, FaShare, FaReply, FaCopy, FaThumbtack } from 'react-icons/fa';
import { LuCheckCheck, LuCheck } from 'react-icons/lu';
import { getSocket } from '../../utils/socket';

const MessageList = ({ messages, recentChats, onRecallMessage, onDeleteMessage, onForwardMessage, chat }) => {
  const currentUserId = JSON.parse(localStorage.getItem('user') || '{}')?.userId;
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [messageToDelete, setMessageToDelete] = useState(null);
  const [fullscreenMedia, setFullscreenMedia] = useState(null);
  const [mediaLoadError, setMediaLoadError] = useState(null);
  const [contextMenu, setContextMenu] = useState({ visible: false, x: 0, y: 0, message: null });
  const [pinnedMessages, setPinnedMessages] = useState([]); // State để lưu tin nhắn ghim
  const [showPinnedList, setShowPinnedList] = useState(false); // State để điều khiển hiển thị danh sách tin nhắn ghim
  const messageListRef = useRef(null);
  const socketRef = useRef(null);

  // Khởi tạo socket
  useEffect(() => {
    socketRef.current = chat?.isGroup ? getSocket('/group') : getSocket('/chat');
  }, [chat]);

  // Lấy danh sách tin nhắn ghim khi component mount hoặc chat thay đổi
  useEffect(() => {
    const fetchPinnedMessages = async () => {
      if (!chat || (!chat.isGroup && !chat.userId) || (chat.isGroup && !chat.groupId)) {
        console.warn('Chat object is invalid or missing required properties:', chat);
        setPinnedMessages([]);
        return;
      }

      try {
        const otherUserId = chat.isGroup ? chat.groupId : chat.userId;
        const response = await fetch(`http://localhost:3000/api/messages/pinned/${otherUserId}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const result = await response.json();
        if (result.success) {
          // Sắp xếp tin nhắn ghim theo timestamp giảm dần (mới nhất trước)
          const sortedMessages = (result.messages || []).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
          setPinnedMessages(sortedMessages);
          console.log('Fetched pinned messages:', sortedMessages); // Log để debug
        } else {
          console.error('Không thể lấy tin nhắn ghim:', result.message);
          setPinnedMessages([]);
        }
      } catch (error) {
        console.error('Lỗi khi lấy tin nhắn ghim:', error);
        setPinnedMessages([]);
      }
    };

    fetchPinnedMessages();
  }, [chat]);

  // Lắng nghe sự kiện ghim tin nhắn qua socket
  useEffect(() => {
    if (!chat || !socketRef.current) return;

    const handlePinnedMessageUpdate = async () => {
      try {
        const otherUserId = chat.isGroup ? chat.groupId : chat.userId;
        const response = await fetch(`http://localhost:3000/api/messages/pinned/${otherUserId}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.ok}`);
        }

        const result = await response.json();
        if (result.success) {
          // Sắp xếp lại tin nhắn ghim
          const sortedMessages = (result.messages || []).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
          setPinnedMessages(sortedMessages);
          console.log('Updated pinned messages:', sortedMessages); // Log để debug
        }
      } catch (error) {
        console.error('Lỗi khi cập nhật tin nhắn ghim qua socket:', error);
      }
    };

    socketRef.current.on('messagePinned', handlePinnedMessageUpdate);

    return () => {
      socketRef.current.off('messagePinned', handlePinnedMessageUpdate);
    };
  }, [chat]);

  useEffect(() => {
    if (messageListRef.current) {
      messageListRef.current.scrollTop = messageListRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    const handleClickOutside = () => {
      setContextMenu({ visible: false, x: 0, y: 0, message: null });
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const handleDeleteClick = (messageId) => {
    if (chat.isGroup) {
      alert('Chức năng xóa tin nhắn nhóm hiện chưa được hỗ trợ.');
      return;
    }
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

  const handleContextMenu = (e, message) => {
    e.preventDefault();
    setContextMenu({
      visible: true,
      x: e.clientX,
      y: e.clientY,
      message,
    });
  };

  const handleContextMenuAction = (action) => {
    const { message } = contextMenu;
    if (!message) return;

    switch (action) {
      case 'reply':
        console.log('Reply to message:', message);
        break;
      case 'forward':
        const targetUserId = prompt('Nhập ID người nhận để chuyển tiếp:');
        if (targetUserId) {
          onForwardMessage(message.id || message.messageId, targetUserId);
        }
        break;
      case 'copy':
        navigator.clipboard.writeText(message.content || '');
        break;
      case 'pin':
        handlePinMessage(message.id || message.messageId);
        break;
      case 'recall':
        if (message.senderId === currentUserId && message.status !== 'recalled') {
          onRecallMessage(message.id || message.messageId);
        }
        break;
      case 'delete':
        handleDeleteClick(message.id || message.messageId);
        break;
      default:
        break;
    }
    setContextMenu({ visible: false, x: 0, y: 0, message: null });
  };

  const handlePinMessage = async (messageId) => {
    try {
      const response = await fetch(`http://localhost:3000/api/messages/pin/${messageId}`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const result = await response.json();
      if (result.success) {
        const otherUserId = chat?.isGroup ? chat.groupId : chat?.userId;
        const pinnedResponse = await fetch(`http://localhost:3000/api/messages/pinned/${otherUserId}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        });

        if (!pinnedResponse.ok) {
          throw new Error(`HTTP error! Status: ${pinnedResponse.status}`);
        }

        const pinnedResult = await pinnedResponse.json();
        if (pinnedResult.success) {
          const sortedMessages = (pinnedResult.messages || []).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
          setPinnedMessages(sortedMessages);
          socketRef.current.emit('messagePinned', { room: chat.isGroup ? `group:${chat.groupId}` : `user:${chat.userId}` });
        } else {
          alert('Không thể lấy danh sách tin nhắn ghim mới: ' + pinnedResult.message);
        }
      } else {
        alert('Không thể ghim tin nhắn: ' + result.message);
      }
    } catch (error) {
      console.error('Lỗi khi ghim tin nhắn:', error);
      alert('Đã xảy ra lỗi khi ghim tin nhắn. Vui lòng thử lại sau.');
    }
  };

  if (!Array.isArray(messages)) {
    console.error('Messages prop is not an array:', messages);
    return <div>Đã xảy ra lỗi khi tải tin nhắn. Vui lòng thử lại.</div>;
  }

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

    const currentTimestamp = new Date(message.timestamp).getTime();
    const timeDifference = lastTimestamp ? (currentTimestamp - lastTimestamp) / 1000 : Infinity;
    const timeThreshold = 15;

    if (isImageMessage && isSameSenderAsPrevious && timeDifference <= timeThreshold) {
      currentGroup.push(message);
    } else {
      if (currentGroup.length > 0) {
        groupedMessages.push({ type: 'image-group', messages: currentGroup, senderId: lastSenderId });
        currentGroup = [];
      }
      if (isImageMessage) {
        currentGroup.push(message);
      } else {
        groupedMessages.push(message);
      }
    }

    if (index === messages.length - 1 && currentGroup.length > 0) {
      groupedMessages.push({ type: 'image-group', messages: currentGroup, senderId: lastSenderId });
    }

    lastSenderId = message.senderId;
    lastTimestamp = currentTimestamp;
  });

  return (
    <div className="message-list" ref={messageListRef}>
      {/* Hiển thị tin nhắn ghim ở trên cùng */}
      <div className="pinned-messages-container">
        {pinnedMessages.length > 0 ? (
          <>
            {/* Chỉ hiển thị tin nhắn ghim mới nhất (index 0 sau khi sắp xếp) */}
            <div className="pinned-message">
              <span className="pinned-message-sender">
                {pinnedMessages[0].sender?.name || (chat?.isGroup ? 'Thành viên nhóm' : chat?.name || 'Không xác định')}
              </span>
              <span className="pinned-message-content">
                {pinnedMessages[0].type === 'text' ? pinnedMessages[0].content : `(${pinnedMessages[0].type})`}
              </span>
              {pinnedMessages.length > 1 && (
                <button
                  className="pinned-messages-toggle"
                  onClick={() => setShowPinnedList(!showPinnedList)}
                >
                  +{pinnedMessages.length - 1} ghim
                </button>
              )}
            </div>
            {/* Khi nhấn nút, hiển thị tất cả tin nhắn ghim */}
            {showPinnedList && pinnedMessages.length > 1 && (
              <div className="pinned-messages-list">
                {pinnedMessages.map((msg, index) => (
                  <div key={index} className="pinned-message-item">
                    <span className="pinned-message-sender">
                      {msg.sender?.name || (chat?.isGroup ? 'Thành viên nhóm' : chat?.name || 'Không xác định')}
                    </span>
                    <span className="pinned-message-content">
                      {msg.type === 'text' ? msg.content : `(${msg.type})`}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="pinned-message-placeholder">
            <span>Chưa có tin nhắn ghim nào.</span>
          </div>
        )}
      </div>

      {/* Danh sách tin nhắn thông thường */}
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
        const isPending = ['pending', 'sending'].includes(firstMessage.status);
        const showStatus = !isSameSenderAsNext || groupIndex === groupedMessages.length - 1;

        return (
          <div
            key={groupIndex}
            className={`message ${isCurrentUser ? 'message-right' : 'message-left'} ${isGroupMessage ? 'media-message' : ''} ${isPending ? 'message-pending' : ''}`}
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
                      {firstMessage.sender?.name || 'Thành viên nhóm'}
                    </span>
                  )}
                  {isGroupMessage ? (
                    <div className="media-message-group">
                      {groupMessages.map((message, idx) => (
                        <div key={message.id || message.messageId || message.tempId} className="media-message-container">
                          {mediaLoadError === (message.id || message.messageId || message.tempId) ? (
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
                              onError={() => handleMediaError(message.id || message.messageId || message.tempId)}
                              style={{ cursor: 'pointer', opacity: isPending ? 0.6 : 1 }}
                            />
                          )}
                          {isPending && (
                            <div className="pending-indicator">
                              <span className="pending-text">Đang gửi</span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div
                      className="message-content"
                      onContextMenu={(e) => handleContextMenu(e, lastMessage)}
                    >
                      {chat?.isGroup && showAvatarAndName && !isGroupMessage && (
                        <span className="message-sender-name-inline">
                          {firstMessage.sender?.name || 'Thành viên nhóm'}
                        </span>
                      )}
                      {firstMessage.type === 'text' && (
                        <p style={{ opacity: isPending ? 0.6 : 1 }}>{firstMessage.content}</p>
                      )}
                      {firstMessage.type === 'video' && firstMessage.mediaUrl ? (
                        <div
                          className="media-message-container"
                          onContextMenu={(e) => handleContextMenu(e, lastMessage)}
                        >
                          <video
                            controls
                            onClick={() => handleMediaClick(firstMessage.mediaUrl, firstMessage.mimeType)}
                            onError={() => handleMediaError(firstMessage.id || firstMessage.messageId || firstMessage.tempId)}
                            style={{ cursor: 'pointer', opacity: isPending ? 0.6 : 1 }}
                          >
                            <source src={firstMessage.mediaUrl} type={firstMessage.mimeType} />
                            Trình duyệt của bạn không hỗ trợ video.
                          </video>
                          {isPending && (
                            <div className="pending-indicator">
                              <span className="pending-text">Đang gửi</span>
                            </div>
                          )}
                        </div>
                      ) : null}
                      {(firstMessage.type === 'file' || firstMessage.type === 'pdf' || firstMessage.type === 'zip') && firstMessage.mediaUrl ? (
                        <div
                          className="media-container"
                          onContextMenu={(e) => handleContextMenu(e, lastMessage)}
                        >
                          <a href={firstMessage.mediaUrl} target="_blank" rel="noopener noreferrer" style={{ opacity: isPending ? 0.6 : 1 }}>
                            {firstMessage.fileName || 'File'}
                          </a>
                          {isPending && (
                            <div className="pending-indicator">
                              <span className="pending-text">Đang gửi</span>
                            </div>
                          )}
                        </div>
                      ) : (
                        firstMessage.type !== 'text' && !firstMessage.mediaUrl && (
                          <p style={{ opacity: isPending ? 0.6 : 1 }}>Không thể hiển thị file: {firstMessage.fileName || 'Unknown'}</p>
                        )
                      )}
                      {firstMessage.status === 'error' && firstMessage.errorMessage && (
                        <p className="error-message">{firstMessage.errorMessage}</p>
                      )}
                      {showTime && (
                        <span className="message-time">
                          {new Date(lastMessage.timestamp).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      )}
                    </div>
                  )}
                  <div className="message-meta">
                    {isCurrentUser && !chat.isGroup && showStatus && (
                      <span className={`message-status ${lastMessage.status}`}>
                        {lastMessage.status === 'sent' && (
                          <>
                            <span className="status-icon">✓</span> Đã gửi
                          </>
                        )}
                        {lastMessage.status === 'delivered' && (
                          <>
                            <LuCheckCheck className="status-icon" /> Đã nhận
                          </>
                        )}
                        {lastMessage.status === 'seen' && 'Đã xem'}
                        {lastMessage.status === 'error' && 'Lỗi'}
                        {isPending && (
                          <span className="pending-text">
                            <LuCheck className="status-icon" /> Đang gửi
                          </span>
                        )}
                      </span>
                    )}
                  </div>
                </>
              )}
              {!isPending && (
                <div className="message-actions">
                  {isCurrentUser && lastMessage.status !== 'recalled' && (
                    <button onClick={() => onRecallMessage(lastMessage.id || lastMessage.messageId)}>
                      <FaUndo />
                    </button>
                  )}
                  {!chat.isGroup && (
                    <button onClick={() => handleDeleteClick(lastMessage.id || lastMessage.messageId)}>
                      <FaTrash />
                    </button>
                  )}
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
              )}
            </div>
          </div>
        );
      })}

      {contextMenu.visible && (
        <div
          className="context-menu"
          style={{ top: contextMenu.y, left: contextMenu.x }}
        >
          <div className="context-menu-item" onClick={() => handleContextMenuAction('reply')}>
            <FaReply /> Trả lời
          </div>
          <div className="context-menu-item" onClick={() => handleContextMenuAction('forward')}>
            <FaShare /> Chuyển tiếp
          </div>
          {contextMenu.message?.type === 'text' && (
            <div className="context-menu-item" onClick={() => handleContextMenuAction('copy')}>
              <FaCopy /> Sao chép
            </div>
          )}
          <div className="context-menu-item" onClick={() => handleContextMenuAction('pin')}>
            <FaThumbtack /> Ghim
          </div>
          {contextMenu.message?.senderId === currentUserId && contextMenu.message?.status !== 'recalled' && (
            <div className="context-menu-item" onClick={() => handleContextMenuAction('recall')}>
              <FaUndo /> Thu hồi
            </div>
          )}
          {!chat.isGroup && (
            <div className="context-menu-item" onClick={() => handleContextMenuAction('delete')}>
              <FaTrash /> Xóa
            </div>
          )}
        </div>
      )}

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