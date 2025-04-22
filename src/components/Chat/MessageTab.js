import React, { useState, useEffect } from 'react';
import axios from 'axios';
import UserSearch from './UserSearch';
import { useNavigate } from 'react-router-dom';
import '../../assets/styles/ChatPage.css';
import { FaBellSlash, FaThumbtack } from 'react-icons/fa';

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
}) => {
  const [chats, setChats] = useState([]);
  const [friendSearchQuery, setFriendSearchQuery] = useState('');
  const [foundUser, setFoundUser] = useState(null);
  const [friendStatus, setFriendStatus] = useState(null);
  const [friendRequestMessage, setFriendRequestMessage] = useState('');
  const navigate = useNavigate();
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  const currentUserId = currentUser?.userId;
  const userName = currentUser?.name || 'Người dùng'; // Lấy userName từ localStorage

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

      console.log('API /api/conversations/summary response:', response.data);

      if (response.data && response.data.success) {
        const conversations = response.data.data?.conversations || [];

        const formattedChats = conversations.map((conv) => {
          console.log('Conversation avatar:', conv.avatar);
          return {
            id: conv.otherUserId,
            name: conv.displayName || 'Không có tên',
            phoneNumber: conv.phoneNumber || '',
            avatar: conv.avatar || 'https://placehold.co/50x50',
            lastMessage:
              conv.lastMessage?.status === 'recalled'
                ? '(Tin nhắn đã thu hồi)'
                : conv.lastMessage?.content || 'Chưa có tin nhắn',
            timestamp: conv.lastMessage?.timestamp || new Date().toISOString(),
            isMuted: conv.isMuted || false,
            isPinned: conv.isPinned || false,
            targetUserId: conv.otherUserId,
          };
        });

        setChats(formattedChats);
      }
    } catch (error) {
      console.error('Error fetching chats:', error);
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

  // Đặt lời nhắn mặc định khi tìm thấy người dùng
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
    if (!friendSearchQuery) return;

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

        const statusResponse = await axios.get(
          `http://localhost:3000/api/friends/status/${formattedUser.userId}`,
          { headers: { Authorization: `Bearer ${token.trim()}` } }
        );

        if (statusResponse.data && statusResponse.data.status) {
          setFriendStatus(statusResponse.data.status);
        } else {
          setFriendStatus('stranger');
        }
      } else {
        setFoundUser(null);
        alert('Không tìm thấy người dùng.');
      }
    } catch (error) {
      setFoundUser(null);
      alert('Không tìm thấy người dùng.');
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

      if (response.data && response.data.message) {
        alert('Đã gửi yêu cầu kết bạn thành công!');
        setFriendStatus('pending_sent');
        setFriendRequestMessage('');
      } else {
        alert('Không thể gửi yêu cầu kết bạn.');
      }
    } catch (error) {
      alert('Lỗi khi gửi yêu cầu kết bạn: ' + (error.response?.data?.error || error.message));
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
      }
    }
  };

  const handleMarkAsRead = async (chatId) => {
    // Tạm thời bỏ logic này vì backend không trả về unreadCount
  };

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
                className={`chat-item ${chat.isPinned ? 'pinned' : ''}`}
                onClick={() => {
                  onSelectChat(chat);
                  handleMarkAsRead(chat.id);
                }}
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
                  <p className="chat-name">
                    {chat.name || 'Không có tên'}
                    {chat.isPinned && <FaThumbtack className="pinned-icon" />}
                    {chat.isMuted && <FaBellSlash className="muted-icon" />}
                  </p>
                  <p className="last-message">{chat.lastMessage || 'Chưa có tin nhắn'}</p>
                  <p className="chat-time">
                    {chat.timestamp
                      ? new Date(chat.timestamp).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : ''}
                  </p>
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
                    <span className="country-code">
                      <span role="img" aria-label="Vietnam flag">🇻🇳</span> (+84)
                    </span>
                    <select className="country-code-select">
                      <option value="+84"></option>
                    </select>
                    <input
                      type="text"
                      placeholder="Không có tìm kiếm nào gần đây"
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
                        maxLength={150} // Giới hạn 150 ký tự
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