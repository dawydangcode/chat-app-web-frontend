import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../../assets/styles/Sidebar.css';

const Sidebar = ({ onSelectChat }) => {
  const [activeTab, setActiveTab] = useState('messages');
  const [chats, setChats] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [userSearchResults, setUserSearchResults] = useState([]);
  const [recentSearches, setRecentSearches] = useState([]);
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [filter, setFilter] = useState('all');
  const [userProfile, setUserProfile] = useState({
    name: '',
    phoneNumber: '',
    avatar: null,
    coverPhoto: null,
    dateOfBirth: null,
    gender: 'Nam',
  });
  const [editMode, setEditMode] = useState(false);
  const [editProfile, setEditProfile] = useState({ ...userProfile });
  const [changePasswordMode, setChangePasswordMode] = useState(false);
  const [passwordData, setPasswordData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const navigate = useNavigate();

  // Lấy dữ liệu từ backend
  useEffect(() => {
    const token = localStorage.getItem('token');
    console.log('📌 Token từ localStorage:', token);
    if (!token || token === 'undefined' || !token.startsWith('eyJ')) {
      console.log('⚠️ Token không hợp lệ hoặc thiếu');
      localStorage.removeItem('token');
      navigate('/login');
      return;
    }

    const fetchChats = async () => {
      try {
        const response = await axios.get('http://localhost:3000/api/chats', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setChats(response.data);
      } catch (error) {
        console.error('Lỗi khi lấy danh sách cuộc trò chuyện:', error);
        if (error.response?.status === 401) {
          alert('Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.');
          localStorage.removeItem('token');
          navigate('/login');
        }
      }
    };

    const fetchContacts = async () => {
      try {
        const response = await axios.get('http://localhost:3000/api/contacts', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setContacts(response.data);
      } catch (error) {
        console.error('Lỗi khi lấy danh sách bạn bè:', error);
        if (error.response?.status === 401) {
          alert('Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.');
          localStorage.removeItem('token');
          navigate('/login');
        }
      }
    };

    const fetchUserProfile = async () => {
      try {
        const response = await axios.get('http://localhost:3000/api/auth/profile', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const profileData = {
          name: response.data.data.name || '',
          phoneNumber: response.data.data.phoneNumber || '',
          avatar: response.data.data.avatar || null,
          coverPhoto: response.data.data.coverPhoto || null,
          dateOfBirth: response.data.data.dateOfBirth || null,
          gender: response.data.data.gender || 'Nam',
        };
        setUserProfile(profileData);
        setEditProfile(profileData);
      } catch (error) {
        console.error('Lỗi khi lấy thông tin người dùng:', error);
        if (error.response?.status === 401) {
          alert('Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.');
          localStorage.removeItem('token');
          navigate('/login');
        }
      }
    };

    // Lấy lịch sử tìm kiếm từ localStorage
    const savedSearches = JSON.parse(localStorage.getItem('recentSearches')) || [];
    setRecentSearches(savedSearches);

    fetchChats();
    fetchContacts();
    fetchUserProfile();
  }, [navigate]);

  // Xử lý tìm kiếm user
  const handleUserSearch = async (query) => {
    setUserSearchQuery(query);
    if (!query) {
      setUserSearchResults([]);
      return;
    }

    // Ràng buộc: Chỉ tìm kiếm khi nhập đủ 10 số
    const phoneRegex = /^\d{10}$/;
    if (!phoneRegex.test(query)) {
      setUserSearchResults([]);
      return;
    }

    const token = localStorage.getItem('token');
    console.log('📌 Token khi tìm kiếm:', token);
    if (!token || token === 'undefined' || !token.startsWith('eyJ')) {
      console.log('⚠️ Token không hợp lệ khi tìm kiếm');
      alert('Vui lòng đăng nhập để tìm kiếm người dùng.');
      localStorage.removeItem('token');
      navigate('/login');
      return;
    }

    try {
      const response = await axios.get(
        `http://localhost:3000/api/friends/search?phoneNumber=${encodeURIComponent(query)}`,
        {
          headers: { Authorization: `Bearer ${token.trim()}` },
        }
      );
      console.log('📌 Response tìm kiếm:', response.data);

      // Kiểm tra response
      if (response.data && response.data.userId) {
        // Response là object người dùng trực tiếp
        setUserSearchResults([response.data]);
      } else if (response.data.success && response.data.data) {
        // Response có định dạng { success: true, data: {...} }
        setUserSearchResults([response.data.data]);
      } else {
        setUserSearchResults([]);
        alert('Không tìm thấy người dùng với số điện thoại này.');
      }
    } catch (error) {
      console.error('Lỗi khi tìm kiếm người dùng:', error);
      setUserSearchResults([]);
      if (error.response?.status === 401) {
        alert('Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.');
        localStorage.removeItem('token');
        navigate('/login');
      } else if (error.response?.status === 404) {
        alert('Không tìm thấy người dùng với số điện thoại này.');
      } else {
        alert('Có lỗi xảy ra khi tìm kiếm. Vui lòng thử lại.');
      }
    }
  };

  // Xử lý chọn user để bắt đầu chat
  const handleSelectUser = async (user) => {
    const token = localStorage.getItem('token');
    console.log('📌 Token khi chọn user:', token);
    if (!token || token === 'undefined' || !token.startsWith('eyJ')) {
      console.log('⚠️ Token không hợp lệ khi chọn user');
      alert('Vui lòng đăng nhập để bắt đầu cuộc trò chuyện.');
      localStorage.removeItem('token');
      navigate('/login');
      return;
    }

    try {
      // Kiểm tra xem cuộc trò chuyện đã tồn tại chưa
      const existingChat = chats.find((chat) =>
        chat.participants?.some((p) => p.id === user.userId)
      );
      if (existingChat) {
        console.log('📌 Mở cuộc trò chuyện hiện có:', existingChat);
        onSelectChat(existingChat);
        setUserSearchQuery('');
        setUserSearchResults([]);
        setIsSearchActive(false);
        return;
      }

      // Tạo cuộc trò chuyện mới
      console.log('📌 Tạo cuộc trò chuyện mới với user:', user.userId);
      const response = await axios.post(
        'http://localhost:3000/api/chats',
        { participantId: user.userId },
        { headers: { Authorization: `Bearer ${token.trim()}` } }
      );

      const newChat = response.data;
      console.log('📌 Cuộc trò chuyện mới:', newChat);
      setChats([...chats, newChat]);
      onSelectChat(newChat);

      // Lưu vào lịch sử tìm kiếm
      const updatedSearches = [
        {
          userId: user.userId,
          name: user.name,
          phoneNumber: user.phoneNumber,
          avatar: user.avatar || null,
        },
        ...recentSearches.filter((search) => search.userId !== user.userId),
      ].slice(0, 5); // Giới hạn 5 tìm kiếm gần đây
      setRecentSearches(updatedSearches);
      localStorage.setItem('recentSearches', JSON.stringify(updatedSearches));

      setUserSearchQuery('');
      setUserSearchResults([]);
      setIsSearchActive(false);
    } catch (error) {
      console.error('Lỗi khi tạo cuộc trò chuyện:', error);
      if (error.response?.status === 401) {
        alert('Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.');
        localStorage.removeItem('token');
        navigate('/login');
      } else {
        alert('Không thể bắt đầu cuộc trò chuyện! Vui lòng thử lại.');
      }
    }
  };

  // Xử lý khi focus vào thanh tìm kiếm
  const handleSearchFocus = () => {
    setIsSearchActive(true);
  };

  // Xử lý đóng form tìm kiếm
  const handleCloseSearch = () => {
    setIsSearchActive(false);
    setUserSearchQuery('');
    setUserSearchResults([]);
  };

  // Xử lý bộ lọc
  const filteredChats = chats;

  const displayedChats = () => {
    if (filter === 'unread') {
      return filteredChats.filter((chat) => chat.unread);
    } else if (filter === 'categorized') {
      return filteredChats.filter((chat) => chat.category);
    }
    return filteredChats;
  };

  // Xử lý đăng xuất
  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  // Xử lý đánh dấu đã đọc
  const handleMarkAsRead = async (chatId) => {
    const token = localStorage.getItem('token');
    console.log('📌 Token khi đánh dấu đã đọc:', token);
    if (!token || token === 'undefined' || !token.startsWith('eyJ')) {
      console.log('⚠️ Token không hợp lệ khi đánh dấu đã đọc');
      navigate('/login');
      return;
    }
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
      console.error('Lỗi khi đánh dấu đã đọc:', error);
      if (error.response?.status === 401) {
        alert('Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.');
        localStorage.removeItem('token');
        navigate('/login');
      }
    }
  };

  // Xử lý thêm bạn
  const handleAddFriend = () => {
    alert('Chức năng thêm bạn đang được phát triển!');
  };

  // Xử lý tạo nhóm
  const handleCreateGroup = () => {
    alert('Chức năng tạo nhóm đang được phát triển!');
  };

  // Xử lý upload avatar
  const handleAvatarUpload = async (event) => {
    const token = localStorage.getItem('token');
    console.log('📌 Token khi upload avatar:', token);
    if (!token || token === 'undefined' || !token.startsWith('eyJ')) {
      console.log('⚠️ Token không hợp lệ khi upload avatar');
      alert('Vui lòng đăng nhập để cập nhật avatar.');
      navigate('/login');
      return;
    }
    const file = event.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('avatar', file);

    try {
      const response = await axios.patch(
        'http://localhost:3000/api/auth/profile',
        formData,
        {
          headers: {
            Authorization: `Bearer ${token.trim()}`,
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      setUserProfile((prev) => ({
        ...prev,
        avatar: response.data.data.avatar,
      }));
      setEditProfile((prev) => ({
        ...prev,
        avatar: response.data.data.avatar,
      }));
      alert('Cập nhật avatar thành công!');
    } catch (error) {
      console.error('Lỗi khi upload avatar:', error);
      if (error.response?.status === 401) {
        alert('Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.');
        localStorage.removeItem('token');
        navigate('/login');
      } else {
        alert('Cập nhật avatar thất bại!');
      }
    }
  };

  // Xử lý chỉnh sửa thông tin
  const handleEditProfile = () => {
    setEditMode(true);
    setChangePasswordMode(false);
  };

  const handleSaveProfile = async () => {
    const token = localStorage.getItem('token');
    console.log('📌 Token khi lưu profile:', token);
    if (!token || token === 'undefined' || !token.startsWith('eyJ')) {
      console.log('⚠️ Token không hợp lệ khi lưu profile');
      alert('Vui lòng đăng nhập để cập nhật thông tin.');
      navigate('/login');
      return;
    }
    const formData = new FormData();
    formData.append('name', editProfile.name);
    formData.append('dateOfBirth', editProfile.dateOfBirth || '');
    formData.append('gender', editProfile.gender);

    try {
      const response = await axios.patch(
        'http://localhost:3000/api/auth/profile',
        formData,
        {
          headers: {
            Authorization: `Bearer ${token.trim()}`,
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      setUserProfile({
        ...userProfile,
        name: response.data.data.name,
        dateOfBirth: response.data.data.dateOfBirth,
        gender: response.data.data.gender,
      });
      setEditMode(false);
      alert('Cập nhật thông tin thành công!');
    } catch (error) {
      console.error('Lỗi khi cập nhật thông tin:', error);
      if (error.response?.status === 401) {
        alert('Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.');
        localStorage.removeItem('token');
        navigate('/login');
      } else {
        alert('Cập nhật thông tin thất bại!');
      }
    }
  };

  const handleCancelEdit = () => {
    setEditProfile({ ...userProfile });
    setEditMode(false);
  };

  // Xử lý đổi mật khẩu
  const handleChangePassword = () => {
    setChangePasswordMode(true);
    setEditMode(false);
  };

  const handleSavePassword = async () => {
    const token = localStorage.getItem('token');
    console.log('📌 Token khi đổi mật khẩu:', token);
    if (!token || token === 'undefined' || !token.startsWith('eyJ')) {
      console.log('⚠️ Token không hợp lệ khi đổi mật khẩu');
      alert('Vui lòng đăng nhập để đổi mật khẩu.');
      navigate('/login');
      return;
    }
    if (!passwordData.oldPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      alert('Vui lòng nhập đầy đủ thông tin!');
      return;
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert('Mật khẩu mới và xác nhận không khớp!');
      return;
    }

    try {
      await axios.post(
        'http://localhost:3000/api/auth/reset-password-login',
        {
          oldPassword: passwordData.oldPassword,
          newPassword: passwordData.newPassword,
        },
        {
          headers: { Authorization: `Bearer ${token.trim()}` },
        }
      );
      setPasswordData({ oldPassword: '', newPassword: '', confirmPassword: '' });
      setChangePasswordMode(false);
      alert('Đổi mật khẩu thành công!');
    } catch (error) {
      console.error('Lỗi khi đổi mật khẩu:', error);
      if (error.response?.status === 401) {
        alert('Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.');
        localStorage.removeItem('token');
        navigate('/login');
      } else {
        alert('Đổi mật khẩu thất bại!');
      }
    }
  };

  const handleCancelPassword = () => {
    setPasswordData({ oldPassword: '', newPassword: '', confirmPassword: '' });
    setChangePasswordMode(false);
  };

  return (
    <div className="sidebar">
      {/* Phần đầu sidebar */}
      <div className="sidebar-header">
        <img
          src={userProfile.avatar || '/assets/images/avatar.png'}
          alt="Avatar"
          className="avatar"
          onClick={() => setActiveTab('settings')}
        />
        <div className="sidebar-actions">
          <button
            className={activeTab === 'messages' ? 'active' : ''}
            onClick={() => setActiveTab('messages')}
          >
            Tin nhắn
          </button>
          <button
            className={activeTab === 'contacts' ? 'active' : ''}
            onClick={() => setActiveTab('contacts')}
          >
            Danh bạ
          </button>
          <button
            className={activeTab === 'settings' ? 'active' : ''}
            onClick={() => setActiveTab('settings')}
          >
            Cài đặt
          </button>
        </div>
      </div>

      {/* Tab Tin nhắn */}
      {activeTab === 'messages' && (
        <div className="chat-list">
          <div className="chat-list-header">
            <input
              type="text"
              placeholder="Tìm kiếm người dùng..."
              value={userSearchQuery}
              onChange={(e) => handleUserSearch(e.target.value)}
              onFocus={handleSearchFocus}
            />
            {isSearchActive ? (
              <button className="action-btn close-btn" onClick={handleCloseSearch}>
                Đóng
              </button>
            ) : (
              <>
                <button className="action-btn" onClick={handleAddFriend}>
                  ➕
                </button>
                <button className="action-btn" onClick={handleCreateGroup}>
                  👥
                </button>
              </>
            )}
          </div>

          {/* Hiển thị form tìm kiếm hoặc tabs lọc */}
          {isSearchActive ? (
            <div className="search-form">
              {/* Kết quả tìm kiếm */}
              {userSearchResults.length > 0 && (
                <div className="user-search-results">
                  <h4>Kết quả tìm kiếm</h4>
                  {userSearchResults.map((user) => (
                    <div
                      key={user.userId}
                      className="user-search-item"
                      onClick={() => handleSelectUser(user)}
                    >
                      <img
                        src={user.avatar || '/assets/images/avatar.png'}
                        alt="Avatar"
                        className="user-search-avatar"
                      />
                      <div className="user-search-info">
                        <p className="user-search-name">{user.name}</p>
                        <p className="user-search-phone">{user.phoneNumber}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Tìm kiếm gần đây */}
              {recentSearches.length > 0 && (
                <div className="recent-searches">
                  <h4>Tìm kiếm gần đây</h4>
                  {recentSearches.map((user) => (
                    <div
                      key={user.userId}
                      className="user-search-item"
                      onClick={() => handleSelectUser(user)}
                    >
                      <img
                        src={user.avatar || '/assets/images/avatar.png'}
                        alt="Avatar"
                        className="user-search-avatar"
                      />
                      <div className="user-search-info">
                        <p className="user-search-name">{user.name}</p>
                        <p className="user-search-phone">{user.phoneNumber}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <>
              <div className="chat-list-tabs">
                <button
                  className={filter === 'all' ? 'active' : ''}
                  onClick={() => setFilter('all')}
                >
                  Tất cả 🗂
                </button>
                <button
                  className={filter === 'unread' ? 'active' : ''}
                  onClick={() => setFilter('unread')}
                >
                  Chưa đọc 📩
                </button>
                <button
                  className={filter === 'categorized' ? 'active' : ''}
                  onClick={() => setFilter('categorized')}
                >
                  Phân loại 🏷
                </button>
                <button onClick={() => handleMarkAsRead()}>
                  Đánh dấu đã đọc ✅
                </button>
              </div>
              {displayedChats().map((chat) => (
                <div
                  key={chat.id}
                  className={`chat-item ${chat.unread ? 'unread' : ''}`}
                  onClick={() => {
                    onSelectChat(chat);
                    handleMarkAsRead(chat.id);
                  }}
                >
                  <p className="chat-name">{chat.name}</p>
                  <p className="last-message">{chat.lastMessage}</p>
                </div>
              ))}
            </>
          )}
        </div>
      )}

      {/* Tab Danh bạ */}
      {activeTab === 'contacts' && (
        <div className="contacts">
          <h3>Danh sách bạn bè</h3>
          {contacts.map((contact) => (
            <div key={contact.id} className="contact-item">
              <p>{contact.name}</p>
              <p className="contact-phone">{contact.phoneNumber}</p>
            </div>
          ))}
        </div>
      )}

      {/* Tab Cài đặt */}
      {activeTab === 'settings' && (
        <div className="settings">
          <h3>Thông tin cá nhân</h3>
          <div className="profile-container">
            <div className="cover-container">
              {userProfile.coverPhoto ? (
                <img
                  src={userProfile.coverPhoto}
                  alt="Cover Photo"
                  className="cover-photo"
                />
              ) : (
                <div className="cover-photo-placeholder">
                  <p>Chưa có ảnh bìa</p>
                </div>
              )}
              <img
                src={userProfile.avatar || '/assets/images/avatar.png'}
                alt="Avatar"
                className="avatar-profile"
              />
            </div>

            {editMode ? (
              <div className="profile-edit">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  className="avatar-upload"
                />
                <label>Tên:</label>
                <input
                  type="text"
                  value={editProfile.name}
                  onChange={(e) =>
                    setEditProfile({ ...editProfile, name: e.target.value })
                  }
                />
                <label>Ngày sinh:</label>
                <input
                  type="date"
                  value={editProfile.dateOfBirth || ''}
                  onChange={(e) =>
                    setEditProfile({ ...editProfile, dateOfBirth: e.target.value })
                  }
                />
                <label>Giới tính:</label>
                <select
                  value={editProfile.gender}
                  onChange={(e) =>
                    setEditProfile({ ...editProfile, gender: e.target.value })
                  }
                >
                  <option value="Nam">Nam</option>
                  <option value="Nữ">Nữ</option>
                </select>
                <div className="edit-actions">
                  <button className="save-btn" onClick={handleSaveProfile}>
                    Lưu
                  </button>
                  <button className="cancel-btn" onClick={handleCancelEdit}>
                    Hủy
                  </button>
                </div>
              </div>
            ) : changePasswordMode ? (
              <div className="profile-edit">
                <label>Mật khẩu cũ:</label>
                <input
                  type="password"
                  value={passwordData.oldPassword}
                  onChange={(e) =>
                    setPasswordData({ ...passwordData, oldPassword: e.target.value })
                  }
                />
                <label>Mật khẩu mới:</label>
                <input
                  type="password"
                  value={passwordData.newPassword}
                  onChange={(e) =>
                    setPasswordData({ ...passwordData, newPassword: e.target.value })
                  }
                />
                <label>Nhập lại mật khẩu mới:</label>
                <input
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) =>
                    setPasswordData({ ...passwordData, confirmPassword: e.target.value })
                  }
                />
                <div className="edit-actions">
                  <button className="save-btn" onClick={handleSavePassword}>
                    Lưu
                  </button>
                  <button className="cancel-btn" onClick={handleCancelPassword}>
                    Hủy
                  </button>
                </div>
              </div>
            ) : (
              <div className="profile-info">
                <p><strong>Tên:</strong> {userProfile.name || 'Chưa cập nhật'}</p>
                <p><strong>Số điện thoại:</strong> {userProfile.phoneNumber ? `+${userProfile.phoneNumber}` : 'Chưa cập nhật'}</p>
                <p><strong>Ngày sinh:</strong> {userProfile.dateOfBirth || 'Chưa cập nhật'}</p>
                <p><strong>Giới tính:</strong> {userProfile.gender || 'Chưa cập nhật'}</p>
                <button className="edit-btn" onClick={handleEditProfile}>
                  Chỉnh sửa thông tin
                </button>
                <button className="change-password-btn" onClick={handleChangePassword}>
                  Đổi mật khẩu
                </button>
              </div>
            )}
          </div>
          <button className="logout-btn" onClick={handleLogout}>
            Đăng xuất
          </button>
        </div>
      )}
    </div>
  );
};

export default Sidebar;