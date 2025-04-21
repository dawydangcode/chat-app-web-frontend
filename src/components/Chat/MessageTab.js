import React, { useState, useEffect } from 'react';
import axios from 'axios';
import UserSearch from './UserSearch';
import { useNavigate } from 'react-router-dom';
import '../../assets/styles/Sidebar.css';

const MessagesTab = ({ onSelectChat }) => {
  const [chats, setChats] = useState([]);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [userSearchResults, setUserSearchResults] = useState([]);
  const [recentSearches, setRecentSearches] = useState([]);
  const [isSearchActive, setIsSearchActive] = useState(false);
  const navigate = useNavigate();
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  const currentUserId = currentUser?.userId;

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
      const response = await axios.get('http://localhost:3000/api/messages/summary', {
        headers: { Authorization: `Bearer ${token.trim()}` },
      });

      if (response.data && response.data.success) {
        const conversations = response.data.data?.conversations || [];
        const formattedChats = conversations.map((conv) => ({
          id: conv.otherUserId,
          name: conv.displayName || 'Không có tên',
          phoneNumber: conv.phoneNumber || '',
          avatar: conv.avatar || '/assets/images/avatar.png',
          lastMessage:
            conv.lastMessage?.status === 'recalled'
              ? '(Tin nhắn đã thu hồi)'
              : conv.lastMessage?.content || 'Chưa có tin nhắn',
          timestamp: conv.lastMessage?.createdAt || new Date().toISOString(),
          unread: conv.unreadCount > 0,
          unreadCount: conv.unreadCount || 0,
          targetUserId: conv.otherUserId,
        }));
        setChats(formattedChats);
      }
    } catch (error) {
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
      }
    }
  };

  useEffect(() => {
    const savedSearches = JSON.parse(localStorage.getItem('recentSearches')) || [];
    setRecentSearches(savedSearches);
    fetchChats();
  }, [navigate, currentUserId]);

  const handleUserSearch = async (query) => {
    setUserSearchQuery(query);
    if (!query) {
      setUserSearchResults([]);
      return;
    }

    const phoneRegex = /^\d{10}$/;
    if (!phoneRegex.test(query)) {
      setUserSearchResults([]);
      return;
    }

    const token = localStorage.getItem('token');
    try {
      const response = await axios.get(
        `http://localhost:3000/api/friends/search?phoneNumber=${encodeURIComponent(query)}`,
        { headers: { Authorization: `Bearer ${token.trim()}` } }
      );

      if (response.data && response.data.userId) {
        setUserSearchResults([response.data]);
      } else if (response.data.success && response.data.data) {
        setUserSearchResults([response.data.data]);
      } else {
        setUserSearchResults([]);
      }
    } catch (error) {
      setUserSearchResults([]);
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
      }
    }
  };

  const handleCloseSearch = () => {
    setIsSearchActive(false);
    setUserSearchQuery('');
    setUserSearchResults([]);
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
  };

  const handleMarkAsRead = async (chatId) => {
    const token = localStorage.getItem('token');
    try {
      await axios.post(
        `http://localhost:3000/api/chats/${chatId}/mark-as-read`,
        {},
        { headers: { Authorization: `Bearer ${token.trim()}` } }
      );
      setChats((prevChats) =>
        prevChats.map((chat) =>
          chat.id === chatId ? { ...chat, unread: false } : chat
        )
      );
    } catch (error) {
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
      }
    }
  };

  return (
    <div className="chat-list">
      <div className="chat-list-header">
        <input
          type="text"
          placeholder="Tìm kiếm"
          value={userSearchQuery}
          onChange={(e) => handleUserSearch(e.target.value)}
          onFocus={() => setIsSearchActive(true)}
        />
        {isSearchActive && (
          <button className="action-btn close-btn" onClick={handleCloseSearch}>
            Đóng
          </button>
        )}
      </div>

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
                className={`chat-item ${chat.unread ? 'unread' : ''}`}
                onClick={() => {
                  onSelectChat(chat);
                  handleMarkAsRead(chat.id);
                }}
              >
                <img
                  src={chat.avatar || '/assets/images/avatar.png'}
                  alt="Avatar"
                  className="chat-avatar"
                />
                <div className="chat-info">
                  <p className="chat-name">{chat.name || 'Không có tên'}</p>
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
                {chat.unread && <span className="unread-badge">{chat.unreadCount || 1}</span>}
              </div>
            ))
          ) : (
            <div className="no-chats">
              <p>Chưa có cuộc trò chuyện nào.</p>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default MessagesTab;