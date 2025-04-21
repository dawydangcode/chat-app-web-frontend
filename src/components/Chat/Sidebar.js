// import React, { useState, useEffect } from 'react';
// import { useNavigate } from 'react-router-dom';
// import axios from 'axios';
// import '../../assets/styles/Sidebar.css';

// const Sidebar = ({ onSelectChat, fetchChatsTrigger }) => {
//   const [activeTab, setActiveTab] = useState('messages');
//   const [chats, setChats] = useState([]);
//   const [contacts, setContacts] = useState([]);
//   const [userSearchQuery, setUserSearchQuery] = useState('');
//   const [userSearchResults, setUserSearchResults] = useState([]);
//   const [recentSearches, setRecentSearches] = useState([]);
//   const [isSearchActive, setIsSearchActive] = useState(false);
//   const [filter, setFilter] = useState('all');
//   const [userProfile, setUserProfile] = useState({
//     name: '',
//     phoneNumber: '',
//     avatar: null,
//     coverPhoto: null,
//     dateOfBirth: null,
//     gender: 'Nam',
//   });
//   const [editMode, setEditMode] = useState(false);
//   const [editProfile, setEditProfile] = useState({ ...userProfile });
//   const [changePasswordMode, setChangePasswordMode] = useState(false);
//   const [passwordData, setPasswordData] = useState({
//     oldPassword: '',
//     newPassword: '',
//     confirmPassword: '',
//   });
//   const navigate = useNavigate();
//   const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
//   const currentUserId = currentUser?.userId;

//   const fetchChats = async () => {
//     console.log('🔄 Bắt đầu lấy tóm tắt hội thoại');

//     if (!currentUserId) {
//       console.log('⚠️ currentUserId không tồn tại');
//       alert('Không tìm thấy thông tin người dùng. Vui lòng đăng nhập lại.');
//       navigate('/login');
//       return;
//     }

//     const token = localStorage.getItem('token');
//     if (!token || token === 'undefined' || !token.startsWith('eyJ')) {
//       console.log('⚠️ Token không hợp lệ khi lấy tóm tắt hội thoại');
//       alert('Vui lòng đăng nhập để xem danh sách cuộc trò chuyện.');
//       navigate('/login');
//       return;
//     }

//     try {
//       console.log('🌐 Gửi API request tới /api/messages/summary');
//       const response = await axios.get('http://localhost:3000/api/messages/summary', {
//         headers: { Authorization: `Bearer ${token.trim()}` },
//       });

//       console.log('📥 API response summary:', response.data);

//       if (response.data && response.data.success) {
//         const conversations = response.data.data?.conversations || [];
//         console.log(`✅ Đã lấy được ${conversations.length} cuộc trò chuyện`);

//         const formattedChats = conversations.map((conv) => ({
//           id: conv.otherUserId,
//           name: conv.displayName || 'Không có tên',
//           phoneNumber: conv.phoneNumber || '',
//           avatar: conv.avatar || '/assets/images/avatar.png',
//           lastMessage:
//             conv.lastMessage?.status === 'recalled'
//               ? '(Tin nhắn đã thu hồi)'
//               : conv.lastMessage?.content || 'Chưa có tin nhắn',
//           timestamp: conv.lastMessage?.createdAt || new Date().toISOString(),
//           unread: conv.unreadCount > 0,
//           unreadCount: conv.unreadCount || 0,
//           targetUserId: conv.otherUserId,
//         }));

//         setChats(formattedChats);
//       } else {
//         console.error('❌ Lỗi khi lấy tóm tắt hội thoại:', response.data?.message);
//         alert('Không thể lấy danh sách cuộc trò chuyện. Vui lòng thử lại sau.');
//       }
//     } catch (error) {
//       console.error('❌ Lỗi khi lấy tóm tắt hội thoại:', error);
//       if (error.response?.status === 401) {
//         alert('Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.');
//         localStorage.removeItem('token');
//         localStorage.removeItem('user');
//         navigate('/login');
//       } else {
//         alert(`Lỗi khi lấy danh sách cuộc trò chuyện: ${error.message}`);
//       }
//     }
//   };

//   const fetchContacts = async () => {
//     if (!currentUserId) {
//       console.log('⚠️ currentUserId không tồn tại');
//       alert('Không tìm thấy thông tin người dùng. Vui lòng đăng nhập lại.');
//       navigate('/login');
//       return;
//     }

//     const token = localStorage.getItem('token');
//     try {
//       const response = await axios.get('http://localhost:3000/api/contacts', {
//         headers: { Authorization: `Bearer ${token}` },
//       });
//       setContacts(response.data);
//     } catch (error) {
//       console.error('Lỗi khi lấy danh sách bạn bè:', error);
//       if (error.response?.status === 401) {
//         alert('Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.');
//         localStorage.removeItem('token');
//         localStorage.removeItem('user');
//         navigate('/login');
//       }
//     }
//   };

//   const fetchUserProfile = async () => {
//     if (!currentUserId) {
//       console.log('⚠️ currentUserId không tồn tại');
//       alert('Không tìm thấy thông tin người dùng. Vui lòng đăng nhập lại.');
//       navigate('/login');
//       return;
//     }

//     const token = localStorage.getItem('token');
//     try {
//       const response = await axios.get('http://localhost:3000/api/auth/profile', {
//         headers: { Authorization: `Bearer ${token}` },
//       });
//       const profileData = {
//         name: response.data.data.name || '',
//         phoneNumber: response.data.data.phoneNumber || '',
//         avatar: response.data.data.avatar || null,
//         coverPhoto: response.data.data.coverPhoto || null,
//         dateOfBirth: response.data.data.dateOfBirth || null,
//         gender: response.data.data.gender || 'Nam',
//       };
//       setUserProfile(profileData);
//       setEditProfile(profileData);
//     } catch (error) {
//       console.error('Lỗi khi lấy thông tin người dùng:', error);
//       if (error.response?.status === 401) {
//         alert('Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.');
//         localStorage.removeItem('token');
//         localStorage.removeItem('user');
//         navigate('/login');
//       }
//     }
//   };

//   useEffect(() => {
//     console.log('📌 Current User ID:', currentUserId);
//     if (!currentUserId) {
//       console.log('⚠️ currentUserId không tồn tại');
//       localStorage.removeItem('token');
//       localStorage.removeItem('user');
//       navigate('/login');
//       return;
//     }

//     const token = localStorage.getItem('token');
//     console.log('📌 Token từ localStorage:', token);
//     if (!token || token === 'undefined' || !token.startsWith('eyJ')) {
//       console.log('⚠️ Token không hợp lệ hoặc thiếu');
//       localStorage.removeItem('token');
//       localStorage.removeItem('user');
//       navigate('/login');
//       return;
//     }

//     const savedSearches = JSON.parse(localStorage.getItem('recentSearches')) || [];
//     setRecentSearches(savedSearches);

//     fetchChats();
//     fetchContacts();
//     fetchUserProfile();
//   }, [navigate, fetchChatsTrigger, currentUserId]);

//   const handleUserSearch = async (query) => {
//     setUserSearchQuery(query);
//     if (!query) {
//       setUserSearchResults([]);
//       return;
//     }

//     if (!currentUserId) {
//       console.log('⚠️ currentUserId không tồn tại');
//       alert('Không tìm thấy thông tin người dùng. Vui lòng đăng nhập lại.');
//       navigate('/login');
//       return;
//     }

//     const phoneRegex = /^\d{10}$/;
//     if (!phoneRegex.test(query)) {
//       setUserSearchResults([]);
//       return;
//     }

//     const token = localStorage.getItem('token');
//     console.log('📌 Token khi tìm kiếm:', token);
//     if (!token || token === 'undefined' || !token.startsWith('eyJ')) {
//       console.log('⚠️ Token không hợp lệ khi tìm kiếm');
//       alert('Vui lòng đăng nhập để tìm kiếm người dùng.');
//       localStorage.removeItem('token');
//       localStorage.removeItem('user');
//       navigate('/login');
//       return;
//     }

//     try {
//       const response = await axios.get(
//         `http://localhost:3000/api/friends/search?phoneNumber=${encodeURIComponent(query)}`,
//         {
//           headers: { Authorization: `Bearer ${token.trim()}` },
//         }
//       );
//       console.log('📌 Response tìm kiếm:', response.data);

//       if (response.data && response.data.userId) {
//         setUserSearchResults([response.data]);
//       } else if (response.data.success && response.data.data) {
//         setUserSearchResults([response.data.data]);
//       } else {
//         setUserSearchResults([]);
//         alert('Không tìm thấy người dùng với số điện thoại này.');
//       }
//     } catch (error) {
//       console.error('Lỗi khi tìm kiếm người dùng:', error);
//       setUserSearchResults([]);
//       if (error.response?.status === 401) {
//         alert('Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.');
//         localStorage.removeItem('token');
//         localStorage.removeItem('user');
//         navigate('/login');
//       } else if (error.response?.status === 404) {
//         alert('Không tìm thấy người dùng với số điện thoại này.');
//       } else {
//         alert('Có lỗi xảy ra khi tìm kiếm. Vui lòng thử lại.');
//       }
//     }
//   };

//   const handleSearchFocus = () => {
//     setIsSearchActive(true);
//   };

//   const handleCloseSearch = () => {
//     setIsSearchActive(false);
//     setUserSearchQuery('');
//     setUserSearchResults([]);
//   };

//   const handleSelectUser = async (user) => {
//     try {
//       if (!currentUserId) {
//         console.log('⚠️ currentUserId không tồn tại');
//         alert('Không tìm thấy thông tin người dùng. Vui lòng đăng nhập lại.');
//         navigate('/login');
//         return;
//       }

//       const token = localStorage.getItem('token');
//       console.log('📌 Token khi chọn user:', token);
//       if (!token || token === 'undefined' || !token.startsWith('eyJ')) {
//         console.log('⚠️ Token không hợp lệ khi chọn user');
//         alert('Vui lòng đăng nhập để bắt đầu trò chuyện.');
//         localStorage.removeItem('token');
//         localStorage.removeItem('user');
//         navigate('/login');
//         return;
//       }

//       if (!user.userId) {
//         console.error('⚠️ user.userId không tồn tại:', user);
//         alert('Không thể bắt đầu trò chuyện: Thông tin người dùng không hợp lệ.');
//         return;
//       }

//       const chat = {
//         id: user.userId,
//         name: user.name,
//         phoneNumber: user.phoneNumber,
//         avatar: user.avatar,
//         participants: [user.userId],
//         targetUserId: user.userId,
//       };

//       setRecentSearches((prev) => {
//         const updated = [
//           { userId: user.userId, name: user.name, phoneNumber: user.phoneNumber, avatar: user.avatar },
//           ...prev.filter((s) => s.userId !== user.userId),
//         ].slice(0, 5);
//         localStorage.setItem('recentSearches', JSON.stringify(updated));
//         return updated;
//       });

//       onSelectChat(chat);
//     } catch (error) {
//       console.error('❌ Lỗi khi xử lý người dùng:', error);
//       alert('Có lỗi xảy ra. Vui lòng thử lại.');
//     }
//   };

//   const filteredChats = chats;

//   const displayedChats = () => {
//     if (filter === 'unread') {
//       return filteredChats.filter((chat) => chat.unread);
//     } else if (filter === 'categorized') {
//       return filteredChats.filter((chat) => chat.category);
//     }
//     return filteredChats;
//   };

//   const handleLogout = () => {
//     localStorage.removeItem('token');
//     localStorage.removeItem('user');
//     navigate('/');
//   };

//   const handleMarkAsRead = async (chatId) => {
//     if (!currentUserId) {
//       console.log('⚠️ currentUserId không tồn tại');
//       alert('Không tìm thấy thông tin người dùng. Vui lòng đăng nhập lại.');
//       navigate('/login');
//       return;
//     }

//     const token = localStorage.getItem('token');
//     console.log('📌 Token khi đánh dấu đã đọc:', token);
//     if (!token || token === 'undefined' || !token.startsWith('eyJ')) {
//       console.log('⚠️ Token không hợp lệ khi đánh dấu đã đọc');
//       localStorage.removeItem('token');
//       localStorage.removeItem('user');
//       navigate('/login');
//       return;
//     }

//     try {
//       await axios.post(
//         `http://localhost:3000/api/chats/${chatId}/mark-as-read`,
//         {},
//         { headers: { Authorization: `Bearer ${token.trim()}` } }
//       );
//       setChats((prevChats) =>
//         prevChats.map((chat) =>
//           chat.id === chatId ? { ...chat, unread: false } : chat
//         )
//       );
//     } catch (error) {
//       console.error('Lỗi khi đánh dấu đã đọc:', error);
//       if (error.response?.status === 401) {
//         alert('Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.');
//         localStorage.removeItem('token');
//         localStorage.removeItem('user');
//         navigate('/login');
//       }
//     }
//   };

//   const handleAddFriend = () => {
//     alert('Chức năng thêm bạn đang được phát triển!');
//   };

//   const handleCreateGroup = () => {
//     alert('Chức năng tạo nhóm đang được phát triển!');
//   };

//   const handleAvatarUpload = async (event) => {
//     if (!currentUserId) {
//       console.log('⚠️ currentUserId không tồn tại');
//       alert('Không tìm thấy thông tin người dùng. Vui lòng đăng nhập lại.');
//       navigate('/login');
//       return;
//     }

//     const token = localStorage.getItem('token');
//     console.log('📌 Token khi upload avatar:', token);
//     if (!token || token === 'undefined' || !token.startsWith('eyJ')) {
//       console.log('⚠️ Token không hợp lệ khi upload avatar');
//       alert('Vui lòng đăng nhập để cập nhật avatar.');
//       localStorage.removeItem('token');
//       localStorage.removeItem('user');
//       navigate('/login');
//       return;
//     }

//     const file = event.target.files[0];
//     if (!file) return;

//     const formData = new FormData();
//     formData.append('avatar', file);

//     try {
//       const response = await axios.patch(
//         'http://localhost:3000/api/auth/profile',
//         formData,
//         {
//           headers: {
//             Authorization: `Bearer ${token.trim()}`,
//             'Content-Type': 'multipart/form-data',
//           },
//         }
//       );
//       setUserProfile((prev) => ({
//         ...prev,
//         avatar: response.data.data.avatar,
//       }));
//       setEditProfile((prev) => ({
//         ...prev,
//         avatar: response.data.data.avatar,
//       }));
//       alert('Cập nhật avatar thành công!');
//     } catch (error) {
//       console.error('Lỗi khi upload avatar:', error);
//       if (error.response?.status === 401) {
//         alert('Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.');
//         localStorage.removeItem('token');
//         localStorage.removeItem('user');
//         navigate('/login');
//       } else {
//         alert('Cập nhật avatar thất bại!');
//       }
//     }
//   };

//   const handleEditProfile = () => {
//     setEditMode(true);
//     setChangePasswordMode(false);
//   };

//   const handleSaveProfile = async () => {
//     if (!currentUserId) {
//       console.log('⚠️ currentUserId không tồn tại');
//       alert('Không tìm thấy thông tin người dùng. Vui lòng đăng nhập lại.');
//       navigate('/login');
//       return;
//     }

//     const token = localStorage.getItem('token');
//     console.log('📌 Token khi lưu profile:', token);
//     if (!token || token === 'undefined' || !token.startsWith('eyJ')) {
//       console.log('⚠️ Token không hợp lệ khi lưu profile');
//       alert('Vui lòng đăng nhập để cập nhật thông tin.');
//       localStorage.removeItem('token');
//       localStorage.removeItem('user');
//       navigate('/login');
//       return;
//     }

//     const formData = new FormData();
//     formData.append('name', editProfile.name);
//     formData.append('dateOfBirth', editProfile.dateOfBirth || '');
//     formData.append('gender', editProfile.gender);

//     try {
//       const response = await axios.patch(
//         'http://localhost:3000/api/auth/profile',
//         formData,
//         {
//           headers: {
//             Authorization: `Bearer ${token.trim()}`,
//             'Content-Type': 'multipart/form-data',
//           },
//         }
//       );
//       setUserProfile({
//         ...userProfile,
//         name: response.data.data.name,
//         dateOfBirth: response.data.data.dateOfBirth,
//         gender: response.data.data.gender,
//       });
//       setEditMode(false);
//       alert('Cập nhật thông tin thành công!');
//     } catch (error) {
//       console.error('Lỗi khi cập nhật thông tin:', error);
//       if (error.response?.status === 401) {
//         alert('Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.');
//         localStorage.removeItem('token');
//         localStorage.removeItem('user');
//         navigate('/login');
//       } else {
//         alert('Cập nhật thông tin thất bại!');
//       }
//     }
//   };

//   const handleCancelEdit = () => {
//     setEditProfile({ ...userProfile });
//     setEditMode(false);
//   };

//   const handleChangePassword = () => {
//     setChangePasswordMode(true);
//     setEditMode(false);
//   };

//   const handleSavePassword = async () => {
//     if (!currentUserId) {
//       console.log('⚠️ currentUserId không tồn tại');
//       alert('Không tìm thấy thông tin người dùng. Vui lòng đăng nhập lại.');
//       navigate('/login');
//       return;
//     }

//     const token = localStorage.getItem('token');
//     console.log('📌 Token khi đổi mật khẩu:', token);
//     if (!token || token === 'undefined' || !token.startsWith('eyJ')) {
//       console.log('⚠️ Token không hợp lệ khi đổi mật khẩu');
//       alert('Vui lòng đăng nhập để đổi mật khẩu.');
//       localStorage.removeItem('token');
//       localStorage.removeItem('user');
//       navigate('/login');
//       return;
//     }

//     if (!passwordData.oldPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
//       alert('Vui lòng nhập đầy đủ thông tin!');
//       return;
//     }
//     if (passwordData.newPassword !== passwordData.confirmPassword) {
//       alert('Mật khẩu mới và xác nhận không khớp!');
//       return;
//     }

//     try {
//       await axios.post(
//         'http://localhost:3000/api/auth/reset-password-login',
//         {
//           oldPassword: passwordData.oldPassword,
//           newPassword: passwordData.newPassword,
//         },
//         {
//           headers: { Authorization: `Bearer ${token.trim()}` },
//         }
//       );
//       setPasswordData({ oldPassword: '', newPassword: '', confirmPassword: '' });
//       setChangePasswordMode(false);
//       alert('Đổi mật khẩu thành công!');
//     } catch (error) {
//       console.error('Lỗi khi đổi mật khẩu:', error);
//       if (error.response?.status === 401) {
//         alert('Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.');
//         localStorage.removeItem('token');
//         localStorage.removeItem('user');
//         navigate('/login');
//       } else {
//         alert('Đổi mật khẩu thất bại!');
//       }
//     }
//   };

//   const handleCancelPassword = () => {
//     setPasswordData({ oldPassword: '', newPassword: '', confirmPassword: '' });
//     setChangePasswordMode(false);
//   };

//   return (
//     <div className="sidebar">
//       <div className="sidebar-header">
//         <img
//           src={userProfile.avatar || '../../assets/images/avatar.png'}
//           alt="Avatar"
//           className="avatar"
//           onClick={() => setActiveTab('settings')}
//         />
//         <div className="sidebar-actions">
//           <button
//             className={activeTab === 'messages' ? 'active' : ''}
//             onClick={() => setActiveTab('messages')}
//           >
//             Tin nhắn
//           </button>
//           <button
//             className={activeTab === 'contacts' ? 'active' : ''}
//             onClick={() => setActiveTab('contacts')}
//           >
//             Danh bạ
//           </button>
//           <button
//             className={activeTab === 'settings' ? 'active' : ''}
//             onClick={() => setActiveTab('settings')}
//           >
//             Cài đặt
//           </button>
//         </div>
//       </div>

//       {activeTab === 'messages' && (
//         <div className="chat-list">
//           <div className="chat-list-header">
//             <input
//               type="text"
//               placeholder="Tìm kiếm người dùng..."
//               value={userSearchQuery}
//               onChange={(e) => handleUserSearch(e.target.value)}
//               onFocus={handleSearchFocus}
//             />
//             {isSearchActive ? (
//               <button className="action-btn close-btn" onClick={handleCloseSearch}>
//                 Đóng
//               </button>
//             ) : (
//               <>
//                 <button className="action-btn" onClick={handleAddFriend}>
//                   ➕
//                 </button>
//                 <button className="action-btn" onClick={handleCreateGroup}>
//                   👥
//                 </button>
//               </>
//             )}
//           </div>

//           {isSearchActive ? (
//             <div className="search-form">
//               {userSearchResults.length > 0 && (
//                 <div className="user-search-results">
//                   <h4>Kết quả tìm kiếm</h4>
//                   {userSearchResults.map((user) => (
//                     <div
//                       key={user.userId}
//                       className="user-search-item"
//                       onClick={() => handleSelectUser(user)}
//                     >
//                       <img
//                         src={user.avatar || '/assets/images/avatar.png'}
//                         alt="Avatar"
//                         className="user-search-avatar"
//                       />
//                       <div className="user-search-info">
//                         <p className="user-search-name">{user.name}</p>
//                         <p className="user-search-phone">{user.phoneNumber}</p>
//                       </div>
//                     </div>
//                   ))}
//                 </div>
//               )}

//               {recentSearches.length > 0 && (
//                 <div className="recent-searches">
//                   <h4>Tìm kiếm gần đây</h4>
//                   {recentSearches.map((user) => (
//                     <div
//                       key={user.userId}
//                       className="user-search-item"
//                       onClick={() => handleSelectUser(user)}
//                     >
//                       <img
//                         src={user.avatar || '/assets/images/avatar.png'}
//                         alt="Avatar"
//                         className="user-search-avatar"
//                       />
//                       <div className="user-search-info">
//                         <p className="user-search-name">{user.name}</p>
//                         <p className="user-search-phone">{user.phoneNumber}</p>
//                       </div>
//                     </div>
//                   ))}
//                 </div>
//               )}
//             </div>
//           ) : (
//             <>
//               <div className="chat-list-tabs">
//                 <button
//                   className={filter === 'all' ? 'active' : ''}
//                   onClick={() => setFilter('all')}
//                 >
//                   Tất cả 🗂
//                 </button>
//                 <button
//                   className={filter === 'unread' ? 'active' : ''}
//                   onClick={() => setFilter('unread')}
//                 >
//                   Chưa đọc 📩
//                 </button>
//                 <button
//                   className={filter === 'categorized' ? 'active' : ''}
//                   onClick={() => setFilter('categorized')}
//                 >
//                   Phân loại 🏷
//                 </button>
//                 <button onClick={() => handleMarkAsRead()}>
//                   Đánh dấu đã đọc ✅
//                 </button>
//               </div>
//               {displayedChats().length > 0 ? (
//                 displayedChats().map((chat) => (
//                   <div
//                     key={chat.id}
//                     className={`chat-item ${chat.unread ? 'unread' : ''}`}
//                     onClick={() => {
//                       console.log('👆 Chọn cuộc trò chuyện:', chat);
//                       onSelectChat(chat);
//                       handleMarkAsRead(chat.id);
//                     }}
//                   >
//                     <img
//                       src={chat.avatar || '/assets/images/avatar.png'}
//                       alt="Avatar"
//                       className="chat-avatar"
//                     />
//                     <div className="chat-info">
//                       <p className="chat-name">{chat.name || 'Không có tên'}</p>
//                       <p className="last-message">{chat.lastMessage || 'Chưa có tin nhắn'}</p>
//                       <p className="chat-time">
//                         {chat.timestamp ? new Date(chat.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
//                       </p>
//                     </div>
//                     {chat.unread && <span className="unread-badge">{chat.unreadCount || 1}</span>}
//                   </div>
//                 ))
//               ) : (
//                 <div className="no-chats">
//                   <p>Chưa có cuộc trò chuyện nào.</p>
//                   <p>Hãy tìm kiếm người dùng để bắt đầu trò chuyện!</p>
//                 </div>
//               )}
//             </>
//           )}
//         </div>
//       )}

//       {activeTab === 'contacts' && (
//         <div className="contacts">
//           <h3>Danh sách bạn bè</h3>
//           {contacts.map((contact) => (
//             <div key={contact.id} className="contact-item">
//               <p>{contact.name}</p>
//               <p className="contact-phone">{contact.phoneNumber}</p>
//             </div>
//           ))}
//         </div>
//       )}

//       {activeTab === 'settings' && (
//         <div className="settings">
//           <h3>Thông tin cá nhân</h3>
//           <div className="profile-container">
//             <div className="cover-container">
//               {userProfile.coverPhoto ? (
//                 <img
//                   src={userProfile.coverPhoto}
//                   alt="Cover Photo"
//                   className="cover-photo"
//                 />
//               ) : (
//                 <div className="cover-photo-placeholder">
//                   <p>Chưa có ảnh bìa</p>
//                 </div>
//               )}
//               <img
//                 src={userProfile.avatar || './assets/images/avatar.png'}
//                 alt="Avatar"
//                 className="avatar-profile"
//               />
//             </div>

//             {editMode ? (
//               <div className="profile-edit">
//                 <input
//                   type="file"
//                   accept="image/*"
//                   onChange={handleAvatarUpload}
//                   className="avatar-upload"
//                 />
//                 <label>Tên:</label>
//                 <input
//                   type="text"
//                   value={editProfile.name}
//                   onChange={(e) =>
//                     setEditProfile({ ...editProfile, name: e.target.value })
//                   }
//                 />
//                 <label>Ngày sinh:</label>
//                 <input
//                   type="date"
//                   value={editProfile.dateOfBirth || ''}
//                   onChange={(e) =>
//                     setEditProfile({ ...editProfile, dateOfBirth: e.target.value })
//                   }
//                 />
//                 <label>Giới tính:</label>
//                 <select
//                   value={editProfile.gender}
//                   onChange={(e) =>
//                     setEditProfile({ ...editProfile, gender: e.target.value })
//                   }
//                 >
//                   <option value="Nam">Nam</option>
//                   <option value="Nữ">Nữ</option>
//                 </select>
//                 <div className="edit-actions">
//                   <button className="save-btn" onClick={handleSaveProfile}>
//                     Lưu
//                   </button>
//                   <button className="cancel-btn" onClick={handleCancelEdit}>
//                     Hủy
//                   </button>
//                 </div>
//               </div>
//             ) : changePasswordMode ? (
//               <div className="profile-edit">
//                 <label>Mật khẩu cũ:</label>
//                 <input
//                   type="password"
//                   value={passwordData.oldPassword}
//                   onChange={(e) =>
//                     setPasswordData({ ...passwordData, oldPassword: e.target.value })
//                   }
//                 />
//                 <label>Mật khẩu mới:</label>
//                 <input
//                   type="password"
//                   value={passwordData.newPassword}
//                   onChange={(e) =>
//                     setPasswordData({ ...passwordData, newPassword: e.target.value })
//                   }
//                 />
//                 <label>Nhập lại mật khẩu mới:</label>
//                 <input
//                   type="password"
//                   value={passwordData.confirmPassword}
//                   onChange={(e) =>
//                     setPasswordData({ ...passwordData, confirmPassword: e.target.value })
//                   }
//                 />
//                 <div className="edit-actions">
//                   <button className="save-btn" onClick={handleSavePassword}>
//                     Lưu
//                   </button>
//                   <button className="cancel-btn" onClick={handleCancelPassword}>
//                     Hủy
//                   </button>
//                 </div>
//               </div>
//             ) : (
//               <div className="profile-info">
//                 <p><strong>Tên:</strong> {userProfile.name || 'Chưa cập nhật'}</p>
//                 <p><strong>Số điện thoại:</strong> {userProfile.phoneNumber ? `+${userProfile.phoneNumber}` : 'Chưa cập nhật'}</p>
//                 <p><strong>Ngày sinh:</strong> {userProfile.dateOfBirth || 'Chưa cập nhật'}</p>
//                 <p><strong>Giới tính:</strong> {userProfile.gender || 'Chưa cập nhật'}</p>
//                 <button className="edit-btn" onClick={handleEditProfile}>
//                   Chỉnh sửa thông tin
//                 </button>
//                 <button className="change-password-btn" onClick={handleChangePassword}>
//                   Đổi mật khẩu
//                 </button>
//               </div>
//             )}
//           </div>
//           <button className="logout-btn" onClick={handleLogout}>
//             Đăng xuất
//           </button>
//         </div>
//       )}
//     </div>
//   );
// };

// export default Sidebar;