import React, { useState, useEffect, useRef } from 'react';
import '../../assets/styles/ChatWindow.css';
import '../../assets/styles/MessageList.css';
import { FaUndo, FaTrash, FaShare, FaReply, FaCopy, FaThumbtack, FaChevronUp, FaChevronDown, FaEllipsisH } from 'react-icons/fa';
import { BiMessageRoundedDetail } from 'react-icons/bi';
import { LuCheckCheck, LuCheck } from 'react-icons/lu';
import { IoChevronDownSharp } from 'react-icons/io5';

const MessageList = ({ messages, recentChats, onRecallMessage, onDeleteMessage, onForwardMessage, chat, socket, messageListRef }) => {
  const currentUserId = JSON.parse(localStorage.getItem('user') || '{}')?.userId;
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [messageToDelete, setMessageToDelete] = useState(null);
  const [fullscreenMedia, setFullscreenMedia] = useState(null);
  const [mediaLoadError, setMediaLoadError] = useState(null);
  const [contextMenu, setContextMenu] = useState({ visible: false, x: 0, y: 0, message: null });
  const [pinnedMessages, setPinnedMessages] = useState([]);
  const [pinnedMessageCache, setPinnedMessageCache] = useState({});
  const [showPinnedList, setShowPinnedList] = useState(false);
  const [pinnedContextMenu, setPinnedContextMenu] = useState({ visible: false, message: null, messageIndex: null });
  const [showUnpinModal, setShowUnpinModal] = useState(false);
  const [messageToUnpin, setMessageToUnpin] = useState(null);

  const fetchPinnedMessages = async () => {
    if (!chat || (!chat.isGroup && !chat.userId) || (chat.isGroup && !chat.targetUserId)) {
      console.warn('Chat object is invalid or missing required properties:', chat);
      setPinnedMessages([]);
      return;
    }

    const otherUserId = chat.isGroup ? chat.targetUserId : chat.userId;
    const cacheKey = `pinned:${otherUserId}`;

    if (pinnedMessageCache[otherUserId]) {
      setPinnedMessages(pinnedMessageCache[otherUserId]);
      return;
    }

    const cachedPinned = localStorage.getItem(cacheKey);
    if (cachedPinned) {
      const parsedPinned = JSON.parse(cachedPinned);
      setPinnedMessages(parsedPinned);
      setPinnedMessageCache(prev => ({
        ...prev,
        [otherUserId]: parsedPinned,
      }));
      return;
    }

    try {
      const response = await fetch(`http://localhost:3000/api/messages/pinned/${otherUserId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      const result = await response.json();
      if (result.success) {
        const sortedMessages = (result.messages || []).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        setPinnedMessages(sortedMessages);
        setPinnedMessageCache(prev => ({
          ...prev,
          [otherUserId]: sortedMessages,
        }));
        localStorage.setItem(cacheKey, JSON.stringify(sortedMessages));
      } else {
        console.error('Không thể lấy tin nhắn ghim:', result.message);
        setPinnedMessages([]);
      }
    } catch (error) {
      console.error('Lỗi khi lấy tin nhắn ghim:', error);
      setPinnedMessages([]);
    }
  };

  const prefetchPinnedMessages = async () => {
    const chatsToPrefetch = recentChats.slice(0, 5);
    for (const recentChat of chatsToPrefetch) {
      const otherUserId = recentChat.id;
      const cacheKey = `pinned:${otherUserId}`;
      if (!pinnedMessageCache[otherUserId] && !localStorage.getItem(cacheKey)) {
        try {
          const response = await fetch(`http://localhost:3000/api/messages/pinned/${otherUserId}`, {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
          });
          if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
          }
          const result = await response.json();
          if (result.success) {
            const sortedMessages = (result.messages || []).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
            setPinnedMessageCache(prev => ({
              ...prev,
              [otherUserId]: sortedMessages,
            }));
            localStorage.setItem(cacheKey, JSON.stringify(sortedMessages));
          }
        } catch (error) {
          console.error(`Error prefetching pinned messages for ${otherUserId}:`, error);
        }
      }
    }
  };

  useEffect(() => {
    fetchPinnedMessages();
    prefetchPinnedMessages();
  }, [chat, recentChats]);

  useEffect(() => {
    if (!chat || !socket) return;

    const room = chat.isGroup ? `group:${chat.targetUserId}` : `conversation:${[currentUserId, chat.userId].sort().join(':')}`;

    const handlePinnedMessageUpdate = data => {
      console.log('Received messagePinned/messageUnpinned event:', data);
      if (data.messages) {
        const otherUserId = chat.isGroup ? chat.targetUserId : chat.userId;
        const sortedMessages = data.messages.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        setPinnedMessages(sortedMessages);
        setPinnedMessageCache(prev => ({
          ...prev,
          [otherUserId]: sortedMessages,
        }));
        localStorage.setItem(`pinned:${otherUserId}`, JSON.stringify(sortedMessages));
      }
    };

    socket.on('messagePinned', handlePinnedMessageUpdate);
    socket.on('messageUnpinned', handlePinnedMessageUpdate);

    return () => {
      socket.off('messagePinned', handlePinnedMessageUpdate);
      socket.off('messageUnpinned', handlePinnedMessageUpdate);
    };
  }, [chat, socket]);

  useEffect(() => {
    if (messageListRef.current) {
      messageListRef.current.scrollTop = messageListRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    const handleClickOutside = () => {
      setContextMenu({ visible: false, x: 0, y: 0, message: null });
      setPinnedContextMenu({ visible: false, message: null, messageIndex: null });
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const handleDeleteClick = messageId => {
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

  const handleMediaError = messageId => {
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

  const handlePinnedContextMenu = (e, message, messageIndex) => {
    e.preventDefault();
    e.stopPropagation();
    setPinnedContextMenu({
      visible: true,
      message,
      messageIndex,
    });
  };

  const handleContextMenuAction = action => {
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

  const handlePinnedContextMenuAction = action => {
    const { message } = pinnedContextMenu;
    if (!message) return;

    switch (action) {
      case 'copy':
        navigator.clipboard.writeText(message.content || '');
        break;
      case 'unpin':
        setMessageToUnpin(message);
        setShowUnpinModal(true);
        break;
      default:
        break;
    }
    setPinnedContextMenu({ visible: false, message: null, messageIndex: null });
  };

  const handlePinMessage = messageId => {
    if (!chat || !socket) return;

    const room = chat.isGroup ? `group:${chat.targetUserId}` : `conversation:${[currentUserId, chat.userId].sort().join(':')}`;
    const eventName = chat.isGroup ? 'pinGroupMessage' : 'pinMessage';
    socket.emit(eventName, { messageId, room, groupId: chat.isGroup ? chat.targetUserId : null }, response => {
      if (!response.success) {
        alert(`Không thể ghim tin nhắn: ${response.message}`);
      }
    });
  };

  const handleUnpinMessage = () => {
    if (!messageToUnpin || !chat || !socket) return;

    const messageId = messageToUnpin.id || messageToUnpin.messageId;
    const room = chat.isGroup ? `group:${chat.targetUserId}` : `conversation:${[currentUserId, chat.userId].sort().join(':')}`;
    const eventName = chat.isGroup ? 'unpinGroupMessage' : 'unpinMessage';
    socket.emit(eventName, { messageId, room, groupId: chat.isGroup ? chat.targetUserId : null }, response => {
      if (response.success) {
        setShowUnpinModal(false);
        setMessageToUnpin(null);
      } else {
        alert(`Không thể bỏ ghim tin nhắn: ${response.message}`);
      }
    });
  };

  const cancelUnpin = () => {
    setShowUnpinModal(false);
    setMessageToUnpin(null);
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
      <div className="pinned-messages-container">
        {pinnedMessages.length > 0 ? (
          <>
            {!showPinnedList ? (
              <div className="pinned-message">
                <div className="pinned-message-left">
                  <BiMessageRoundedDetail className="pinned-message-icon" />
                  <div className="pinned-message-text">
                    <div className="pinned-message-label">Tin nhắn</div>
                    <div className="pinned-message-details">
                      <span className="pinned-message-sender">
                        {(() => {
                          const senderId = pinnedMessages[0].senderId || pinnedMessages[0].sender?.userId;
                          if (senderId === currentUserId) {
                            return JSON.parse(localStorage.getItem('user') || '{}')?.name || 'Bạn';
                          }
                          return pinnedMessages[0].sender?.name || chat?.name || 'Không xác định';
                        })()}:
                      </span>
                      <span className="pinned-message-content">
                        {pinnedMessages[0].type === 'text' ? pinnedMessages[0].content : `(${pinnedMessages[0].type})`}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="pinned-message-right">
                  {pinnedMessages.length > 1 && (
                    <button
                      className="pinned-messages-toggle"
                      onClick={() => setShowPinnedList(true)}
                    >
                      +{pinnedMessages.length - 1} ghim <IoChevronDownSharp size={10} />
                    </button>
                  )}
                  <div className="pinned-message-options-wrapper">
                    <button
                      className="pinned-message-options"
                      onClick={e => handlePinnedContextMenu(e, pinnedMessages[0], 0)}
                    >
                      <FaEllipsisH />
                    </button>
                    {pinnedContextMenu.visible && pinnedContextMenu.messageIndex === 0 && (
                      <div className="pinned-context-menu">
                        {pinnedMessages[0].type === 'text' && (
                          <div className="context-menu-item" onClick={() => handlePinnedContextMenuAction('copy')}>
                            <FaCopy /> Sao chép
                          </div>
                        )}
                        <div className="context-menu-item" onClick={() => handlePinnedContextMenuAction('unpin')}>
                          <FaThumbtack /> Bỏ ghim
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="pinned-messages-list">
                <div className="pinned-messages-header">
                  <h4>Danh sách tin nhắn ghim ({pinnedMessages.length})</h4>
                  <button
                    className="pinned-messages-collapse"
                    onClick={() => setShowPinnedList(false)}
                  >
                    Thu gọn <FaChevronUp />
                  </button>
                </div>
                {pinnedMessages.map((msg, index) => (
                  <div key={index} className="pinned-message-item">
                    <div className="pinned-message-left">
                      <BiMessageRoundedDetail className="pinned-message-icon" />
                      <div className="pinned-message-text">
                        <div className="pinned-message-label">Tin nhắn</div>
                        <div className="pinned-message-details">
                          <span className="pinned-message-sender">
                            {(() => {
                              const senderId = msg.senderId || msg.sender?.userId;
                              if (senderId === currentUserId) {
                                return JSON.parse(localStorage.getItem('user') || '{}')?.name || 'Bạn';
                              }
                              return msg.sender?.name || chat?.name || 'Không xác định';
                            })()}:
                          </span>
                          <span className="pinned-message-content">
                            {msg.type === 'text' ? msg.content : `(${msg.type})`}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="pinned-message-right">
                      <div className="pinned-message-options-wrapper">
                        <button
                          className="pinned-message-options"
                          onClick={e => handlePinnedContextMenu(e, msg, index + 1)}
                        >
                          <FaEllipsisH />
                        </button>
                        {pinnedContextMenu.visible && pinnedContextMenu.messageIndex === index + 1 && (
                          <div className="pinned-context-menu">
                            {msg.type === 'text' && (
                              <div className="context-menu-item" onClick={() => handlePinnedContextMenuAction('copy')}>
                                <FaCopy /> Sao chép
                              </div>
                            )}
                            <div className="context-menu-item" onClick={() => handlePinnedContextMenuAction('unpin')}>
                              <FaThumbtack /> Bỏ ghim
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
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
            id={`message-${lastMessage.id || lastMessage.messageId}`}
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
                      onContextMenu={e => handleContextMenu(e, lastMessage)}
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
                          onContextMenu={e => handleContextMenu(e, lastMessage)}
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
                          onContextMenu={e => handleContextMenu(e, lastMessage)}
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
                          {new Date(lastMessage.timestamp).toLocaleTimeString('vi-VN', {
                            hour: '2-digit',
                            minute: '2-digit',
                            hour12: false,
                          })}
                        </span>
                      )}
                    </div>
                  )}
                  <div className="message-meta">
                    {isCurrentUser && showStatus && (
                      <span className={`message-status ${lastMessage.status}`}>
                        {lastMessage.status === 'sent' && (
                          <>
                            <LuCheck className="status-icon" /> Đã gửi
                          </>
                        )}
                        {lastMessage.status === 'delivered' && (
                          <>
                            <LuCheckCheck className="status-icon" /> Đã nhận
                          </>
                        )}
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

      {showUnpinModal && (
        <div className="delete-modal">
          <div className="delete-modal-content">
            <h3>Bỏ ghim</h3>
            <p>Bạn có chắc muốn bỏ ghim nội dung này không?</p>
            <div className="delete-modal-actions">
              <button onClick={cancelUnpin} className="cancel-btn">
                Không
              </button>
              <button onClick={handleUnpinMessage} className="unpin-btn">
                Bỏ ghim
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