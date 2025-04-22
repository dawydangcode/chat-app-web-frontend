import React, { useState, useEffect } from 'react';
import axios from 'axios';
import SidebarHeader from '../components/Chat/SidebarHeader';
import ChatListHeader from '../components/Chat/ChatListHeader';
import MessagesTab from '../components/Chat/MessageTab';
import ChatWindow from '../components/Chat/ChatWindow';
import ConversationInfo from '../components/Chat/ConversationInfo';
import SettingsTab from '../components/SettingTab';
import ContactsTab from '../components/ContactsTab';
import '../assets/styles/ChatPage.css';

const ChatPage = () => {
  const [activeTab, setActiveTab] = useState('messages');
  const [selectedChat, setSelectedChat] = useState(null);
  const [isInfoVisible, setIsInfoVisible] = useState(true);
  const [userProfile, setUserProfile] = useState({
    name: '',
    avatar: null,
  });
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [userSearchResults, setUserSearchResults] = useState([]);
  const [recentSearches, setRecentSearches] = useState([]);
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [activeSection, setActiveSection] = useState('friendRequests');
  const [friendRequests, setFriendRequests] = useState([]);
  const [sentFriendRequests, setSentFriendRequests] = useState([]);
  const [friends, setFriends] = useState([]);
  const [isAddFriendModalOpen, setIsAddFriendModalOpen] = useState(false);

  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  const currentUserId = currentUser?.userId;

  const fetchFriendRequests = async () => {
    const token = localStorage.getItem('token');
    if (!token || !token.startsWith('eyJ')) {
      window.location.href = '/login';
      return;
    }

    try {
      const response = await axios.get('http://localhost:3000/api/friends/received', {
        headers: { Authorization: `Bearer ${token.trim()}` },
      });

      if (response.data && response.data.length > 0) {
        const formattedRequests = response.data.map((request) => ({
          id: request.requestId,
          name: request.senderInfo?.name || request.senderId,
          avatar: request.senderInfo?.avatar || 'https://placehold.co/40x40',
          requestDate: new Date(request.createdAt).toLocaleString(),
          senderId: request.senderId,
          message: request.message || 'Không có lời nhắn',
        }));

        setFriendRequests(formattedRequests);
      } else {
        setFriendRequests([]);
      }
    } catch (error) {
      console.error('Error fetching friend requests:', error);
      setFriendRequests([]);
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }
  };

  const fetchSentFriendRequests = async () => {
    const token = localStorage.getItem('token');
    if (!token || !token.startsWith('eyJ')) {
      window.location.href = '/login';
      return;
    }

    try {
      const response = await axios.get('http://localhost:3000/api/friends/sent', {
        headers: { Authorization: `Bearer ${token.trim()}` },
      });

      if (response.data && response.data.length > 0) {
        const formattedRequests = response.data.map((request) => ({
          id: request.requestId,
          name: request.receiverInfo?.name || request.userId,
          avatar: request.receiverInfo?.avatar || 'https://placehold.co/40x40',
          requestDate: new Date(request.createdAt).toLocaleString(),
          receiverId: request.userId,
          message: request.message || 'Không có lời nhắn',
        }));

        setSentFriendRequests(formattedRequests);
      } else {
        setSentFriendRequests([]);
      }
    } catch (error) {
      console.error('Error fetching sent friend requests:', error);
      setSentFriendRequests([]);
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }
  };

  // Hàm định dạng thời gian theo yêu cầu: "4/22/2025, 4:23:30 PM"
  const formatDateTime = (date) => {
    const d = new Date(date);
    const month = d.getMonth() + 1; // Tháng từ 0-11, cần +1
    const day = d.getDate();
    const year = d.getFullYear();
    const hours = d.getHours();
    const minutes = d.getMinutes();
    const seconds = d.getSeconds();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const hours12 = hours % 12 || 12; // Chuyển sang định dạng 12 giờ
    return `${month}/${day}/${year}, ${hours12}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')} ${ampm}`;
  };

  const fetchFriends = async () => {
    const token = localStorage.getItem('token');
    if (!token || !token.startsWith('eyJ')) {
      window.location.href = '/login';
      return;
    }

    try {
      // Lấy danh sách bạn bè từ API /api/friends/list
      const response = await axios.get('http://localhost:3000/api/friends/list', {
        headers: { Authorization: `Bearer ${token.trim()}` },
      });

      if (response.data && response.data.length > 0) {
        // Gọi API /api/friends/profile/:targetUserId để lấy thông tin chi tiết cho từng bạn bè
        const friendsWithDetails = await Promise.all(
          response.data.map(async (friend) => {
            try {
              const profileResponse = await axios.get(
                `http://localhost:3000/api/friends/profile/${friend.friendId}`,
                { headers: { Authorization: `Bearer ${token.trim()}` } }
              );
              return {
                friendId: friend.friendId,
                name: profileResponse.data.name || friend.friendId, // Dùng friendId nếu không có tên
                avatar: profileResponse.data.avatar || 'https://placehold.co/40x40',
                addedAt: formatDateTime(friend.addedAt), // Định dạng thời gian theo yêu cầu
              };
            } catch (error) {
              console.error(`Error fetching profile for friend ${friend.friendId}:`, error);
              return {
                friendId: friend.friendId,
                name: friend.friendId, // Fallback về friendId nếu lỗi
                avatar: 'https://placehold.co/40x40',
                addedAt: formatDateTime(friend.addedAt),
              };
            }
          })
        );
        setFriends(friendsWithDetails);
      } else {
        setFriends([]);
      }
    } catch (error) {
      console.error('Error fetching friends:', error);
      setFriends([]);
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }
  };

  const handleRemoveFriend = async (friendId) => {
    const token = localStorage.getItem('token');
    try {
      const response = await axios.post(
        'http://localhost:3000/api/friends/remove',
        { friendId },
        { headers: { Authorization: `Bearer ${token.trim()}` } }
      );

      if (response.data && response.data.message) {
        alert('Đã xóa bạn bè thành công!');
        fetchFriends();
        fetchFriendRequests();
        fetchSentFriendRequests();
      }
    } catch (error) {
      alert('Lỗi khi xóa bạn bè: ' + (error.response?.data?.message || error.message));
    }
  };

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!currentUserId) {
        window.location.href = '/login';
        return;
      }

      const token = localStorage.getItem('token');
      if (!token || !token.startsWith('eyJ')) {
        window.location.href = '/login';
        return;
      }

      try {
        const response = await axios.get('http://localhost:3000/api/auth/profile', {
          headers: { Authorization: `Bearer ${token.trim()}` },
        });
        const profileData = {
          name: response.data.data.name || 'User Name',
          avatar: response.data.data.avatar || '/assets/images/avatar.png',
        };
        setUserProfile(profileData);

        const updatedUser = {
          ...currentUser,
          name: response.data.data.name,
          avatar: response.data.data.avatar,
        };
        localStorage.setItem('user', JSON.stringify(updatedUser));
      } catch (error) {
        if (error.response?.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.href = '/login';
        }
      }
    };

    const savedSearches = JSON.parse(localStorage.getItem('recentSearches')) || [];
    setRecentSearches(savedSearches);

    fetchUserProfile();
    fetchFriendRequests();
    fetchSentFriendRequests();
    fetchFriends();
  }, [currentUserId]);

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
        `http://localhost:3000/api/search/users/by-phone?phoneNumber=${encodeURIComponent(query)}`,
        { headers: { Authorization: `Bearer ${token.trim()}` } }
      );

      if (response.data && response.data.success && response.data.data && response.data.data.length > 0) {
        const formattedResults = response.data.data.map(user => ({
          ...user,
          avatar: user.avatar || 'https://placehold.co/50x50',
          coverPhoto: user.coverPhoto || 'https://placehold.co/400x150',
          gender: user.gender || 'Không xác định',
          dateOfBirth: user.dateOfBirth || 'Không có thông tin',
        }));
        setUserSearchResults(formattedResults);
      } else {
        setUserSearchResults([]);
      }
    } catch (error) {
      setUserSearchResults([]);
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }
  };

  const handleCloseSearch = () => {
    setIsSearchActive(false);
    setUserSearchQuery('');
    setUserSearchResults([]);
  };

  const handleAddFriend = () => {
    setIsAddFriendModalOpen(true);
  };

  const handleCreateGroup = () => {
    console.log('Tạo nhóm chat được nhấn');
  };

  const handleSelectChat = (chat) => {
    setSelectedChat(chat);
  };

  const toggleInfo = () => {
    setIsInfoVisible((prev) => !prev);
  };

  const handleAcceptRequest = async (requestId) => {
    const token = localStorage.getItem('token');
    try {
      const response = await axios.post(
        'http://localhost:3000/api/friends/accept',
        { requestId },
        { headers: { Authorization: `Bearer ${token.trim()}` } }
      );

      if (response.data && response.data.message) {
        alert('Đã chấp nhận lời mời kết bạn!');
        fetchFriendRequests();
        fetchFriends();
      }
    } catch (error) {
      alert('Lỗi khi chấp nhận lời mời: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleDeclineRequest = async (requestId) => {
    const token = localStorage.getItem('token');
    try {
      const response = await axios.post(
        'http://localhost:3000/api/friends/reject',
        { requestId },
        { headers: { Authorization: `Bearer ${token.trim()}` } }
      );

      if (response.data && response.data.message) {
        alert('Đã từ chối lời mời kết bạn!');
        fetchFriendRequests();
      }
    } catch (error) {
      alert('Lỗi khi từ chối lời mời: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleCancelRequest = async (requestId) => {
    const token = localStorage.getItem('token');
    try {
      const response = await axios.post(
        'http://localhost:3000/api/friends/cancel',
        { requestId },
        { headers: { Authorization: `Bearer ${token.trim()}` } }
      );

      if (response.data && response.data.message) {
        alert('Đã thu hồi lời mời kết bạn!');
        fetchSentFriendRequests();
      }
    } catch (error) {
      alert('Lỗi khi thu hồi lời mời: ' + (error.response?.data?.message || error.message));
    }
  };

  const getSectionHeader = () => {
    switch (activeSection) {
      case 'friends':
        return 'Danh sách bạn bè';
      case 'groups':
        return 'Danh sách nhóm';
      case 'friendRequests':
        return 'Lời mời kết bạn';
      default:
        return '';
    }
  };

  return (
    <div className="parent">
      <div className="div1">
        <SidebarHeader
          userProfile={userProfile}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
        />
      </div>
      <div className="div2">
        <ChatListHeader
          isSearchActive={isSearchActive}
          setIsSearchActive={setIsSearchActive}
          userSearchQuery={userSearchQuery}
          setUserSearchQuery={setUserSearchQuery}
          handleUserSearch={handleUserSearch}
          handleAddFriend={handleAddFriend}
          handleCreateGroup={handleCreateGroup}
          handleCloseSearch={handleCloseSearch}
        />
        <div className="tab-content">
          {activeTab === 'messages' && (
            <MessagesTab
              onSelectChat={handleSelectChat}
              userSearchQuery={userSearchQuery}
              setUserSearchQuery={setUserSearchQuery}
              userSearchResults={userSearchResults}
              setUserSearchResults={setUserSearchResults}
              recentSearches={recentSearches}
              setRecentSearches={setRecentSearches}
              isSearchActive={isSearchActive}
              setIsSearchActive={setIsSearchActive}
              handleUserSearch={handleUserSearch}
              handleAddFriend={handleAddFriend}
              handleCreateGroup={handleCreateGroup}
              handleCloseSearch={handleCloseSearch}
              isAddFriendModalOpen={isAddFriendModalOpen}
              setIsAddFriendModalOpen={setIsAddFriendModalOpen}
            />
          )}
          {activeTab === 'contacts' && (
            <ContactsTab
              setActiveSection={setActiveSection}
              friendRequestsCount={friendRequests.length}
            />
          )}
          {activeTab === 'settings' && <SettingsTab />}
        </div>
      </div>
      <div className={`div3 ${!isInfoVisible ? 'expanded' : ''}`}>
        {activeTab === 'messages' ? (
          selectedChat ? (
            <ChatWindow
              chat={selectedChat}
              toggleInfo={toggleInfo}
              isInfoVisible={isInfoVisible}
            />
          ) : (
            <div className="no-chat-selected">
              <p>Chọn một cuộc trò chuyện để bắt đầu!</p>
            </div>
          )
        ) : activeTab === 'contacts' ? (
          <div className="contacts-container">
            <div className="contacts-header-bar">
              <h3>{getSectionHeader()}</h3>
            </div>
            <div className="contacts-content">
              {activeSection === 'friends' && (
                <div className="friends-list">
                  {friends.length > 0 ? (
                    friends.map((friend) => (
                      <div key={friend.friendId} className="friend-item">
                        <img
                          src={friend.avatar}
                          alt="Avatar"
                          className="friend-avatar"
                        />
                        <div className="friend-info">
                          <p className="friend-name">{friend.name}</p>
                          <p className="friend-added-at">Thêm vào: {friend.addedAt}</p>
                          <div className="friend-actions">
                            <button
                              className="remove-friend-btn"
                              onClick={() => handleRemoveFriend(friend.friendId)}
                            >
                              Xóa bạn
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p>Chưa có danh sách bạn bè.</p>
                  )}
                </div>
              )}
              {activeSection === 'groups' && (
                <div className="groups-list">
                  <p>Chưa có danh sách nhóm.</p>
                </div>
              )}
              {activeSection === 'friendRequests' && (
                <div className="friend-requests">
                  <div className="received-requests">
                    <h4>Lời mời đã nhận ({friendRequests.length})</h4>
                    {friendRequests.length > 0 ? (
                      friendRequests.map((request) => (
                        <div key={request.id} className="friend-request-item">
                          <img
                            src={request.avatar}
                            alt="Avatar"
                            className="friend-request-avatar"
                          />
                          <div className="friend-request-info">
                            <p className="friend-request-name">{request.name}</p>
                            <p className="friend-request-message">{request.message}</p>
                            <div className="friend-request-actions">
                              <button
                                className="decline-btn"
                                onClick={() => handleDeclineRequest(request.id)}
                              >
                                Từ chối
                              </button>
                              <button
                                className="accept-btn"
                                onClick={() => handleAcceptRequest(request.id)}
                              >
                                Đồng ý
                              </button>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p>Không có lời mời kết bạn.</p>
                    )}
                  </div>
                  <div className="sent-requests">
                    <h4>Lời mời đã gửi ({sentFriendRequests.length})</h4>
                    {sentFriendRequests.length > 0 ? (
                      sentFriendRequests.map((request) => (
                        <div key={request.id} className="friend-request-item">
                          <img
                            src={request.avatar}
                            alt="Avatar"
                            className="friend-request-avatar"
                          />
                          <div className="friend-request-info">
                            <p className="friend-request-name">{request.name}</p>
                            <p className="friend-request-message">{request.message}</p>
                            <div className="friend-request-actions">
                              <button
                                className="cancel-btn"
                                onClick={() => handleCancelRequest(request.id)}
                              >
                                Thu hồi
                              </button>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p>Không có lời mời đã gửi.</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="no-content-selected">
            <p>Chọn một mục để xem chi tiết!</p>
          </div>
        )}
      </div>
      {isInfoVisible && activeTab === 'messages' && (
        <div className="div4">
          {selectedChat && <ConversationInfo chat={selectedChat} />}
        </div>
      )}
    </div>
  );
};

export default ChatPage;