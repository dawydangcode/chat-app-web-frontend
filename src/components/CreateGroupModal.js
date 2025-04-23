import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../assets/styles/CreateGroupModal.css';

const CreateGroupModal = ({ isOpen, onClose, onGroupCreated = () => {} }) => {
  const [groupName, setGroupName] = useState('');
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [users, setUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [avatarFile, setAvatarFile] = useState(null); // State for avatar file
  const [avatarPreview, setAvatarPreview] = useState(null); // State for avatar preview

  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  const currentUserId = currentUser?.userId;
  const token = localStorage.getItem('token');

  useEffect(() => {
    if (isOpen) {
      fetchUsers();
    }
  }, [isOpen]);

  const fetchUsers = async () => {
    if (!currentUserId || !token) {
      onClose();
      window.location.href = '/login';
      return;
    }

    try {
      const convResponse = await axios.get('http://localhost:3000/api/conversations/summary', {
        headers: { Authorization: `Bearer ${token.trim()}` },
      });

      let recentUsers = [];
      if (convResponse.data && convResponse.data.success) {
        const conversations = convResponse.data.data?.conversations || [];
        recentUsers = conversations.map(conv => ({
          userId: conv.otherUserId,
          name: conv.displayName || 'Không có tên',
          avatar: conv.avatar || 'https://placehold.co/50x50',
        }));
      }

      const friendsResponse = await axios.get('http://localhost:3000/api/friends/list', {
        headers: { Authorization: `Bearer ${token.trim()}` },
      });

      let friends = [];
      if (friendsResponse.data && friendsResponse.data.length > 0) {
        friends = await Promise.all(
          friendsResponse.data.map(async friend => {
            try {
              const profileResponse = await axios.get(
                `http://localhost:3000/api/friends/profile/${friend.friendId}`,
                { headers: { Authorization: `Bearer ${token.trim()}` } }
              );
              return {
                userId: friend.friendId,
                name: profileResponse.data.name || friend.friendId,
                avatar: profileResponse.data.avatar || 'https://placehold.co/50x50',
              };
            } catch (error) {
              return {
                userId: friend.friendId,
                name: friend.friendId,
                avatar: 'https://placehold.co/50x50',
              };
            }
          })
        );
      }

      const combinedUsers = [...recentUsers, ...friends];
      const uniqueUsers = Array.from(
        new Map(combinedUsers.map(user => [user.userId, user])).values()
      );

      const filteredUsers = uniqueUsers.filter(user => user.userId !== currentUserId);
      setUsers(filteredUsers);
    } catch (error) {
      console.error('Lỗi khi lấy danh sách người dùng:', error);
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        onClose();
        window.location.href = '/login';
      }
    }
  };

  const handleMemberToggle = (userId) => {
    if (selectedMembers.includes(userId)) {
      setSelectedMembers(selectedMembers.filter(id => id !== userId));
    } else {
      setSelectedMembers([...selectedMembers, userId]);
    }
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
      if (!allowedTypes.includes(file.type)) {
        alert('Chỉ hỗ trợ các định dạng ảnh JPEG, PNG hoặc GIF!');
        return;
      }
      if (file.size > 5 * 1024 * 1024) { // Limit to 5MB
        alert('Kích thước ảnh không được vượt quá 5MB!');
        return;
      }
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim()) {
      alert('Vui lòng nhập tên nhóm!');
      return;
    }
    if (groupName.length > 50) {
      alert('Tên nhóm không được dài quá 50 ký tự!');
      return;
    }
    if (selectedMembers.length < 2) {
      alert('Vui lòng chọn ít nhất 2 thành viên để tạo nhóm!');
      return;
    }

    try {
      // Step 1: Create the group without the avatar
      const createResponse = await axios.post(
        'http://localhost:3000/api/groups/create',
        {
          name: groupName.trim(),
          members: selectedMembers,
          initialRoles: selectedMembers.reduce((roles, memberId) => {
            roles[memberId] = 'member';
            return roles;
          }, { [currentUserId]: 'admin' }),
        },
        { headers: { Authorization: `Bearer ${token.trim()}` } }
      );

      if (createResponse.data.success) {
        const newGroup = createResponse.data.data;

        // Step 2: If an avatar is selected, update the group with the avatar
        if (avatarFile) {
          const formData = new FormData();
          formData.append('avatar', avatarFile);
          formData.append('name', groupName.trim()); // Include name again as it's required by the endpoint

          await axios.put(
            `http://localhost:3000/api/groups/info/${newGroup.groupId}`,
            formData,
            {
              headers: {
                Authorization: `Bearer ${token.trim()}`,
                'Content-Type': 'multipart/form-data',
              },
            }
          );
        }

        if (typeof onGroupCreated === 'function') {
          onGroupCreated(newGroup);
        } else {
          console.warn('onGroupCreated is not a function. Please ensure the parent component passes a valid callback function as the onGroupCreated prop.');
        }
        onClose();
        setGroupName('');
        setSelectedMembers([]);
        setAvatarFile(null);
        setAvatarPreview(null);
      }
    } catch (error) {
      console.error('Lỗi khi tạo nhóm:', error);
      alert(error.response?.data?.message || 'Lỗi khi tạo nhóm!');
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        onClose();
        window.location.href = '/login';
      }
    }
  };

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2>Tạo nhóm</h2>
          <button className="close-btn" onClick={onClose}>✖</button>
        </div>

        <div className="modal-search">
          <input
            type="text"
            placeholder="Nhập tên nhóm..."
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            className="group-name-input"
          />
          <div className="avatar-upload">
            <label htmlFor="avatar-input">
              {avatarPreview ? (
                <img src={avatarPreview} alt="Group avatar preview" className="avatar-preview" />
              ) : (
                <span>Chọn ảnh nhóm</span>
              )}
            </label>
            <input
              id="avatar-input"
              type="file"
              accept="image/jpeg,image/png,image/gif"
              onChange={handleAvatarChange}
              style={{ display: 'none' }}
            />
          </div>
          <input
            type="text"
            placeholder="Tìm kiếm người dùng..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="user-list">
          <h3>Danh sách người dùng</h3>
          {filteredUsers.length > 0 ? (
            filteredUsers.map(user => (
              <div key={user.userId} className="user-item">
                <input
                  type="checkbox"
                  checked={selectedMembers.includes(user.userId)}
                  onChange={() => handleMemberToggle(user.userId)}
                />
                <img src={user.avatar} alt="avatar" className="user-avatar" />
                <span>{user.name}</span>
              </div>
            ))
          ) : (
            <p>Không tìm thấy người dùng.</p>
          )}
        </div>

        <div className="modal-actions">
          <button className="cancel-btn" onClick={onClose}>Hủy</button>
          <button className="create-btn" onClick={handleCreateGroup}>Tạo nhóm</button>
        </div>
      </div>
    </div>
  );
};

export default CreateGroupModal;