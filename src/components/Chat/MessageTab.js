import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import UserSearch from './UserSearch';
import { useNavigate } from 'react-router-dom';
import '../../assets/styles/ChatPage.css';
import { FaBellSlash, FaThumbtack, FaUsers } from 'react-icons/fa';
import { initializeSocket, getSocket } from '../../utils/socket';
import { RiPushpinFill } from "react-icons/ri";

// Utility function for debouncing
const debounce = (func, wait) => {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

// Hàm tính toán thời gian từ tin nhắn cuối cùng đến hiện tại
const getTimeDifference = (timestamp) => {
  if (!timestamp) return '';

  const now = new Date();
  const lastMessageTime = new Date(timestamp);
  const diffInSeconds = Math.floor((now - lastMessageTime) / 1000);

  if (diffInSeconds < 10) {
    return 'Vừa xong';
  } else if (diffInSeconds < 60) {
    return `${diffInSeconds} giây trước`;
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes} phút trước`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours} giờ trước`;
  } else if (diffInSeconds < 604800) {
    const days = Math.floor(diffInSeconds / 86400);
    return days === 1 ? 'Hôm qua' : `${days} ngày trước`;
  } else if (diffInSeconds < 691200) {
    return '7 ngày trước';
  } else {
    return lastMessageTime.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  }
};

const MessagesTab = ({
  onSelectChat,
  userSearchQuery,
  setUserSearchQuery,
  userSearchResults,
  setUserSearchResults,
  recentSearches,
  setRecentSearches,
  isSearchActive,
  setIsSearchActive,
  handleUserSearch,
  handleAddFriend,
  handleCreateGroup,
  handleCloseSearch,
  isAddFriendModalOpen,
  setIsAddFriendModalOpen,
  newMessageHighlights,
  setNewMessageHighlights,
  unreadCounts,
  setUnreadCounts,
  selectedChat,
}) => {
  const [chats, setChats] = useState([]);
  const [friendSearchQuery, setFriendSearchQuery] = useState('');
  const [foundUser, setFoundUser] = useState(null);
  const [friendStatus, setFriendStatus] = useState(null);
  const [friendRequestMessage, setFriendRequestMessage] = useState('');
  const [contextMenu, setContextMenu] = useState(null);
  const [timeDifferences, setTimeDifferences] = useState({});
  const navigate = useNavigate();
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  const currentUserId = currentUser?.userId;
  const userName = currentUser?.name || 'Người dùng';
  const contextMenuRef = useRef(null);

  const fetchChats = async () => {
    if (!currentUserId) {
      navigate('/login');
      return;
    }

    const token = localStorage.getItem('token');
    if (!token || !token.startsWith('eyJ')) {
      navigate('/login');
      return;
    }

    try {
      const response = await axios.get('http://localhost:3000/api/conversations/summary', {
        headers: { Authorization: `Bearer ${token.trim()}` },
      });

      if (response.data && response.data.success) {
        const { conversations = [], groups = [] } = response.data.data;

        const formattedIndividualChats = conversations.map((conv) => {
          console.log('Conversation:', conv);
          return {
            id: conv.otherUserId,
            name: conv.displayName || 'Không có tên',
            phoneNumber: conv.phoneNumber || '',
            avatar: conv.avatar || 'https://placehold.co/50x50',
            lastMessage:
              conv.lastMessage?.status === 'recalled'
                ? '(Tin nhắn đã thu hồi)'
                : conv.lastMessage?.content || 'Chưa có tin nhắn',
            lastMessageSender: conv.lastMessage?.senderId === currentUserId ? 'Bạn' : '',
            timestamp: conv.lastMessage?.timestamp || new Date().toISOString(),
            isMuted: conv.isMuted || false,
            isPinned: conv.isPinned || false,
            targetUserId: conv.otherUserId,
            isGroup: false,
            unreadCount: conv.unreadCount || 0,
          };
        });

        const formattedGroupChats = groups.map((group) => ({
          id: group.groupId,
          name: group.name || 'Nhóm không tên',
          avatar: group.avatar || 'https://placehold.co/50x50',
          lastMessage:
            group.lastMessage?.isRecalled
              ? '(Tin nhắn đã thu hồi)'
              : group.lastMessage?.content || 'Chưa có tin nhắn',
          lastMessageSender: group.lastMessage?.senderId === currentUserId ? 'Bạn' : group.lastMessage?.sender?.name || 'Thành viên nhóm',
          timestamp: group.lastMessage?.timestamp || group.createdAt || new Date().toISOString(),
          isMuted: false,
          isPinned: false,
          targetUserId: group.groupId,
          isGroup: true,
          memberCount: group.memberCount || 0,
          unreadCount: group.unreadCount || 0,
        }));

        const combinedChats = [...formattedIndividualChats, ...formattedGroupChats].sort((a, b) => {
          if (a.isPinned && !b.isPinned) return -1;
          if (!a.isPinned && b.isPinned) return 1;
          return new Date(b.timestamp) - new Date(a.timestamp);
        });

        setChats(combinedChats);
        setUnreadCounts(
          combinedChats.reduce((acc, chat) => ({
            ...acc,
            [chat.id]: chat.unreadCount || 0,
          }), {})
        );

        const initialTimeDiffs = combinedChats.reduce((acc, chat) => ({
          ...acc,
          [chat.id]: getTimeDifference(chat.timestamp),
        }), {});
        setTimeDifferences(initialTimeDiffs);
      }
    } catch (error) {
      console.error('Lỗi khi lấy danh sách hội thoại:', error);
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
      }
    }
  };

  useEffect(() => {
    fetchChats();
  }, [navigate, currentUserId]);

  // Cập nhật thời gian mỗi phút
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeDifferences((prev) => {
        const updated = { ...prev };
        chats.forEach((chat) => {
          updated[chat.id] = getTimeDifference(chat.timestamp);
        });
        return updated;
      });
    }, 60000);

    return () => clearInterval(interval);
  }, [chats]);

  useEffect(() => {
    if (!currentUserId) return;

    const token = localStorage.getItem('token');
    let chatSocket, groupSocket;

    try {
      chatSocket = initializeSocket(token, '/chat');
      groupSocket = initializeSocket(token, '/group');
    } catch (error) {
      console.error('Socket initialization failed:', error);
      navigate('/login');
      return;
    }

    const handleReceiveMessage = debounce((data) => {
      const newMessage = data.message || data;
      const conversationId = newMessage.senderId === currentUserId ? newMessage.receiverId : newMessage.senderId;

      console.log('Received message:', { conversationId, selectedChatId: selectedChat?.id });

      setChats((prevChats) =>
        prevChats.map((chat) =>
          chat.id === conversationId
            ? {
                ...chat,
                lastMessage: newMessage.status === 'recalled' ? '(Tin nhắn đã thu hồi)' : newMessage.content || 'Chưa có tin nhắn',
                lastMessageSender: newMessage.senderId === currentUserId ? 'Bạn' : '',
                timestamp: newMessage.timestamp || new Date().toISOString(),
              }
            : chat
        ).sort((a, b) => {
          if (a.isPinned && !b.isPinned) return -1;
          if (!a.isPinned && b.isPinned) return 1;
          return new Date(b.timestamp) - new Date(a.timestamp);
        })
      );

      setTimeDifferences((prev) => ({
        ...prev,
        [conversationId]: getTimeDifference(newMessage.timestamp || new Date().toISOString()),
      }));

      if (newMessage.senderId !== currentUserId && conversationId !== selectedChat?.id) {
        console.log('Adding notification for:', { conversationId });
        setNewMessageHighlights((prev) => {
          const newSet = new Set(prev);
          newSet.add(conversationId);
          return newSet;
        });
        setUnreadCounts((prev) => ({
          ...prev,
          [conversationId]: (prev[conversationId] || 0) + 1,
        }));
      }
    }, 100);

    const handleNewGroupMessage = debounce((data) => {
      const { groupId, message } = data;
      if (message.senderId !== currentUserId) {
        setChats((prevChats) =>
          prevChats.map((chat) =>
            chat.id === groupId
              ? {
                  ...chat,
                  lastMessage: message.status === 'recalled' ? '(Tin nhắn đã thu hồi)' : message.content || 'Chưa có tin nhắn',
                  lastMessageSender: message.senderId === currentUserId ? 'Bạn' : message.sender?.name || 'Thành viên nhóm',
                  timestamp: message.timestamp || new Date().toISOString(),
                }
              : chat
          ).sort((a, b) => {
            if (a.isPinned && !b.isPinned) return -1;
            if (!a.isPinned && b.isPinned) return 1;
            return new Date(b.timestamp) - new Date(a.timestamp);
          })
        );

        setTimeDifferences((prev) => ({
          ...prev,
          [groupId]: getTimeDifference(message.timestamp || new Date().toISOString()),
        }));

        if (groupId !== selectedChat?.id) {
          console.log('Adding group notification for:', { groupId });
          setNewMessageHighlights((prev) => {
            const newSet = new Set(prev);
            newSet.add(groupId);
            return newSet;
          });
          setUnreadCounts((prev) => ({
            ...prev,
            [groupId]: (prev[groupId] || 0) + 1,
          }));
        }
      }
    }, 100);

    const handleUpdateChatList = (data) => {
      const { conversationId, message } = data;
      const senderId = message.senderId === currentUserId ? message.receiverId : message.senderId;
      const chatId = message.groupId || senderId;

      setChats((prevChats) => {
        const chatIndex = prevChats.findIndex((chat) => chat.id === chatId);
        if (chatIndex === -1) {
          return prevChats;
        }

        const updatedChats = [...prevChats];
        updatedChats[chatIndex] = {
          ...updatedChats[chatIndex],
          lastMessage: message.status === 'recalled' ? '(Tin nhắn đã thu hồi)' : message.content || 'Chưa có tin nhắn',
          lastMessageSender: message.senderId === currentUserId ? 'Bạn' : updatedChats[chatIndex].name,
          timestamp: message.timestamp || new Date().toISOString(),
        };

        return updatedChats.sort((a, b) => {
          if (a.isPinned && !b.isPinned) return -1;
          if (!a.isPinned && b.isPinned) return 1;
          return new Date(b.timestamp) - new Date(a.timestamp);
        });
      });

      setTimeDifferences((prev) => ({
        ...prev,
        [chatId]: getTimeDifference(message.timestamp || new Date().toISOString()),
      }));

      if (message.senderId !== currentUserId && chatId !== selectedChat?.id) {
        setNewMessageHighlights((prev) => {
          const newSet = new Set(prev);
          newSet.add(chatId);
          return newSet;
        });
        setUnreadCounts((prev) => ({
          ...prev,
          [chatId]: (prev[chatId] || 0) + 1,
        }));
      }
    };

    chatSocket.on('receiveMessage', handleReceiveMessage);
    groupSocket.on('newGroupMessage', handleNewGroupMessage);
    chatSocket.on('updateChatList', handleUpdateChatList);
    groupSocket.on('updateChatList', handleUpdateChatList);

    return () => {
      chatSocket.off('receiveMessage', handleReceiveMessage);
      groupSocket.off('newGroupMessage', handleNewGroupMessage);
      chatSocket.off('updateChatList', handleUpdateChatList);
      groupSocket.off('updateChatList', handleUpdateChatList);
    };
  }, [currentUserId, navigate, selectedChat]);

  useEffect(() => {
    if (foundUser && friendStatus === 'stranger') {
      setFriendRequestMessage(
        `Xin chào, mình là ${userName}, mình biết bạn qua số điện thoại. Hãy kết bạn với mình nhé!`
      );
    }
  }, [foundUser, friendStatus, userName]);

  const handleCloseModal = () => {
    setIsAddFriendModalOpen(false);
    setFoundUser(null);
    setFriendSearchQuery('');
    setFriendStatus(null);
    setFriendRequestMessage('');
  };

  const handleSearchFriend = async () => {
    if (!friendSearchQuery) {
      alert('Vui lòng nhập số điện thoại để tìm kiếm.');
      return;
    }

    const phoneRegex = /^\d{10}$/;
    if (!phoneRegex.test(friendSearchQuery)) {
      alert('Vui lòng nhập số điện thoại hợp lệ (10 chữ số).');
      return;
    }

    const token = localStorage.getItem('token');
    try {
      const response = await axios.get(
        `http://localhost:3000/api/searchs/users/by-phone?phoneNumber=${encodeURIComponent(friendSearchQuery)}`,
        { headers: { Authorization: `Bearer ${token.trim()}` } }
      );

      if (response.data && response.data.success && response.data.data && response.data.data.length > 0) {
        const formattedUser = {
          ...response.data.data[0],
          avatar: response.data.data[0].avatar || 'https://placehold.co/50x50',
          coverPhoto: response.data.data[0].coverPhoto || 'https://placehold.co/400x150',
          gender: response.data.data[0].gender || 'Không xác định',
          dateOfBirth: response.data.data[0].dateOfBirth || 'Không có thông tin',
        };
        setFoundUser(formattedUser);

        try {
          const statusResponse = await axios.get(
            `http://localhost:3000/api/friends/status/${formattedUser.userId}`,
            { headers: { Authorization: `Bearer ${token.trim()}` } }
          );

          if (statusResponse.data && statusResponse.data.status) {
            setFriendStatus(statusResponse.data.status);
          } else {
            setFriendStatus('stranger');
          }
        } catch (statusError) {
          console.error('Lỗi khi lấy trạng thái bạn bè:', statusError);
          if (statusError.response?.status === 404) {
            setFriendStatus('stranger');
          } else {
            alert(
              'Không thể kiểm tra trạng thái bạn bè do lỗi hệ thống. Giả định đây là người lạ để bạn có thể gửi lời mời kết bạn.'
            );
            setFriendStatus('stranger');
          }
        }
      } else {
        setFoundUser(null);
        alert('Không tìm thấy người dùng với số điện thoại này.');
      }
    } catch (error) {
      setFoundUser(null);
      alert('Không tìm thấy người dùng: ' + (error.response?.data?.message || 'Lỗi hệ thống.'));
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
      }
    }
  };

  const handleSelectUser = async (user) => {
    const chat = {
      id: user.userId,
      name: user.name,
      phoneNumber: user.phoneNumber,
      avatar: user.avatar,
      participants: [user.userId],
      targetUserId: user.userId,
    };

    setRecentSearches((prev) => {
      const updated = [
        { userId: user.userId, name: user.name, phoneNumber: user.phoneNumber, avatar: user.avatar },
        ...prev.filter((s) => s.userId !== user.userId),
      ].slice(0, 5);
      localStorage.setItem('recentSearches', JSON.stringify(updated));
      return updated;
    });

    onSelectChat(chat);
    handleCloseModal();
  };

  const handleAddFriendRequest = async (user) => {
    if (!friendRequestMessage || friendRequestMessage.trim() === '') {
      alert('Vui lòng nhập lời nhắn để gửi kèm lời mời kết bạn!');
      return;
    }

    const token = localStorage.getItem('token');
    try {
      const response = await axios.post(
        'http://localhost:3000/api/friends/send',
        { receiverId: user.userId, message: friendRequestMessage },
        { headers: { Authorization: `Bearer ${token.trim()}` } }
      );

      if (response.data && response.data.success) {
        alert('Đã gửi yêu cầu kết bạn thành công!');
        setFriendStatus('pending_sent');
        setFriendRequestMessage('');
      } else {
        alert('Không thể gửi yêu cầu kết bạn: ' + (response.data?.error || 'Phản hồi không hợp lệ từ server.'));
      }
    } catch (error) {
      const errorMessage =
        error.response?.data?.error ||
        error.response?.data?.message ||
        'Lỗi hệ thống khi gửi yêu cầu kết bạn. Vui lòng thử lại sau.';
      alert('Lỗi khi gửi yêu cầu kết bạn: ' + errorMessage);
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
      }
    }
  };

  const handleMarkAsRead = async (chatId) => {
    try {
      const token = localStorage.getItem('token');
      const socket = getSocket('/chat');

      const endpoint = chatId.includes('-')
        ? `http://localhost:3000/api/groups/messages/mark-as-seen/${chatId}`
        : `http://localhost:3000/api/messages/mark-as-seen/${chatId}`;

      const response = await axios.post(
        endpoint,
        {},
        { headers: { Authorization: `Bearer ${token.trim()}` } }
      );

      if (response.data.success) {
        console.log(`Messages marked as seen for chat ${chatId}`);
      }
    } catch (error) {
      console.error('Lỗi khi đánh dấu tin nhắn là đã xem:', error);
    }
  };

  const handleSelectChat = (chat) => {
    setNewMessageHighlights((prev) => {
      const newSet = new Set(prev);
      newSet.delete(chat.id);
      return newSet;
    });
    setUnreadCounts((prev) => ({
      ...prev,
      [chat.id]: 0,
    }));

    onSelectChat(chat);
    handleMarkAsRead(chat.id);
  };

  const getPinnedChatsCount = () => {
    return chats.filter((chat) => chat.isPinned).length;
  };

  const handlePinConversation = async (chat) => {
    if (chat.isPinned) {
      console.log('Conversation is already pinned:', chat.id);
      return;
    }

    const token = localStorage.getItem('token');
    try {
      const pinnedCount = getPinnedChatsCount();
      if (pinnedCount >= 5) {
        alert('Bạn chỉ có thể ghim tối đa 5 hội thoại!');
        return;
      }

      const response = await axios.post(
        'http://localhost:3000/api/conversations/pin-conversation',
        { pinnedUserId: chat.id },
        { headers: { Authorization: `Bearer ${token.trim()}` } }
      );

      if (response.data.success) {
        setChats((prevChats) =>
          prevChats.map((c) =>
            c.id === chat.id ? { ...c, isPinned: true } : c
          ).sort((a, b) => {
            if (a.isPinned && !b.isPinned) return -1;
            if (!a.isPinned && b.isPinned) return 1;
            return new Date(b.timestamp) - new Date(a.timestamp);
          })
        );
        alert('Đã ghim hội thoại!');
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message;
      if (errorMessage === 'Hội thoại đã được ghim!') {
        console.log('Conversation is already pinned, no action needed.');
      } else {
        alert('Lỗi khi ghim hội thoại: ' + errorMessage);
      }
    }
  };

  const handleUnpinConversation = async (chat) => {
    if (!chat.isPinned) {
      console.log('Conversation is not pinned:', chat.id);
      return;
    }

    const token = localStorage.getItem('token');
    try {
      const response = await axios.post(
        'http://localhost:3000/api/conversations/unpin-conversation',
        { pinnedUserId: chat.id },
        { headers: { Authorization: `Bearer ${token.trim()}` } }
      );

      if (response.data.success) {
        setChats((prevChats) =>
          prevChats.map((c) =>
            c.id === chat.id ? { ...c, isPinned: false } : c
          ).sort((a, b) => {
            if (a.isPinned && !b.isPinned) return -1;
            if (!a.isPinned && b.isPinned) return 1;
            return new Date(b.timestamp) - new Date(a.timestamp);
          })
        );
        alert('Đã bỏ ghim hội thoại!');
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message;
      if (errorMessage === 'Hội thoại chưa được ghim!') {
        console.log('Conversation is not pinned, no action needed.');
      } else {
        alert('Lỗi khi bỏ ghim hội thoại: ' + errorMessage);
      }
    }
  };

  const handleContextMenu = (event, chat) => {
    event.preventDefault();
    const { clientX, clientY } = event;
    setContextMenu({
      x: clientX,
      y: clientY,
      chat,
    });
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (contextMenuRef.current && !contextMenuRef.current.contains(event.target)) {
        setContextMenu(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="chat-list-content">
      {isSearchActive ? (
        <UserSearch
          userSearchResults={userSearchResults}
          recentSearches={recentSearches}
          handleSelectUser={handleSelectUser}
        />
      ) : (
        <>
          {chats.length > 0 ? (
            chats.map((chat) => (
              <div
                key={chat.id}
                className={`chat-item ${chat.isPinned ? 'pinned' : ''} ${
                  newMessageHighlights.has(chat.id) ? 'new-message-highlight' : ''
                } ${unreadCounts[chat.id] > 0 ? 'unread' : ''} ${
                  selectedChat?.id === chat.id ? 'selected-chat' : ''
                }`}
                onClick={() => handleSelectChat(chat)}
                onContextMenu={(e) => handleContextMenu(e, chat)}
              >
                <img
                  src={chat.avatar}
                  alt="Avatar"
                  className="chat-avatar"
                  onError={(e) => {
                    console.log('Error loading avatar for chat:', chat.id, chat.avatar);
                    e.target.src = 'https://placehold.co/50x50';
                  }}
                />
                <div className="chat-info">
                  <div className="chat-header-row">
                    <p className="chat-name">
                      {chat.name || 'Không có tên'}
                      {chat.isGroup && <FaUsers className="group-icon" title="Nhóm chat" />}
                      {chat.isMuted && <FaBellSlash className="muted-icon" />}
                    </p>
                    <p className="chat-time-difference">
                      {timeDifferences[chat.id] || ''}
                    </p>
                  </div>
                  <div className="last-message-row">
                    <p className="last-message">
                      {chat.lastMessageSender ? `${chat.lastMessageSender}: ` : ''}{chat.lastMessage || 'Chưa có tin nhắn'}
                    </p>
                    {unreadCounts[chat.id] > 0 ? (
                      <span className="unread-badge">{unreadCounts[chat.id]}</span>
                    ) : (
                      chat.isPinned && <RiPushpinFill className="pinned-icon" />
                    )}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="no-chats">
              <p>Chưa có cuộc trò chuyện nào.</p>
            </div>
          )}
        </>
      )}

      {contextMenu && (
        <div
          className="context-menu"
          ref={contextMenuRef}
          style={{
            top: contextMenu.y,
            left: contextMenu.x,
            position: 'fixed',
            zIndex: 1000,
          }}
        >
          <div
            className="context-menu-item"
            onClick={() =>
              contextMenu.chat.isPinned
                ? handleUnpinConversation(contextMenu.chat)
                : handlePinConversation(contextMenu.chat)
            }
          >
            {contextMenu.chat.isPinned ? 'Bỏ ghim hội thoại' : 'Ghim hội thoại'}
          </div>
          <div className="context-menu-divider" />
          <div className="context-menu-item">Thêm vào nhóm</div>
          <div className="context-menu-item">Ẩn trò chuyện</div>
          <div className="context-menu-item">Tắt thông báo hội thoại</div>
          <div className="context-menu-item">Tin nhắn tự xóa</div>
          <div className="context-menu-divider" />
          <div className="context-menu-item context-menu-item-danger">Xóa hội thoại</div>
          <div className="context-menu-divider" />
          <div className="context-menu-item">Báo xấu</div>
        </div>
      )}

      {isAddFriendModalOpen && (
        <div className="modal-overlay">
          <div className="add-friend-modal">
            <div className="modal-header">
              <h3>Thêm bạn</h3>
              <button className="modal-close-btn" onClick={handleCloseModal}>
                ×
              </button>
            </div>
            <div className="modal-body">
              {!foundUser ? (
                <>
                  <div className="friend-search-container">
                    <input
                      type="text"
                      placeholder="Nhập số điện thoại để tìm kiếm"
                      value={friendSearchQuery}
                      onChange={(e) => setFriendSearchQuery(e.target.value)}
                    />
                  </div>
                  <div className="modal-actions">
                    <button className="modal-cancel-btn" onClick={handleCloseModal}>
                      Hủy
                    </button>
                    <button className="modal-search-btn" onClick={handleSearchFriend}>
                      Tìm kiếm
                    </button>
                  </div>
                </>
              ) : (
                <div className="user-profile">
                  <div className="user-cover-photo">
                    <img src={foundUser.coverPhoto} alt="Cover Photo" />
                  </div>
                  <div className="user-avatar">
                    <img src={foundUser.avatar} alt="Avatar" />
                  </div>
                  <h4>{foundUser.name}</h4>
                  <div className="user-info">
                    <p>
                      <strong>Giới tính:</strong> {foundUser.gender}
                    </p>
                    <p>
                      <strong>Ngày sinh:</strong> {foundUser.dateOfBirth}
                    </p>
                  </div>
                  {friendStatus === 'stranger' && (
                    <div className="friend-request-message">
                      <textarea
                        placeholder="Nhập lời nhắn gửi kèm lời mời kết bạn..."
                        value={friendRequestMessage}
                        onChange={(e) => setFriendRequestMessage(e.target.value)}
                        rows={3}
                        maxLength={150}
                      />
                      <p className="char-counter">
                        {friendRequestMessage.length}/150
                      </p>
                    </div>
                  )}
                  <div className="user-actions">
                    {friendStatus === 'stranger' && (
                      <button
                        className="add-friend-action-btn"
                        onClick={() => handleAddFriendRequest(foundUser)}
                      >
                        Kết bạn
                      </button>
                    )}
                    {friendStatus === 'pending_sent' && (
                      <button className="add-friend-action-btn" disabled>
                        Đã gửi yêu cầu
                      </button>
                    )}
                    {friendStatus === 'pending_received' && (
                      <button className="add-friend-action-btn" disabled>
                        Đang chờ bạn chấp nhận
                      </button>
                    )}
                    {friendStatus === 'blocked' && (
                      <button className="add-friend-action-btn" disabled>
                        Đã bị chặn
                      </button>
                    )}
                    {friendStatus === 'friend' && (
                      <button className="add-friend-action-btn" disabled>
                        Đã là bạn bè
                      </button>
                    )}
                    <button
                      className="message-action-btn"
                      onClick={() => handleSelectUser(foundUser)}
                    >
                      Nhắn tin
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MessagesTab;