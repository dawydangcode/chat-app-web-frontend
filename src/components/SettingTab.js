import React, { useState, useEffect } from 'react';
import ProfileEdit from './ProfileEdit';
import ChangePassword from './ChangePassword';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../assets/styles/Sidebar.css';

const SettingsTab = () => {
  const [userProfile, setUserProfile] = useState({
    name: '',
    phoneNumber: '',
    avatar: null,
    coverPhoto: null,
    dateOfBirth: null,
    gender: 'Nam',
  });
  const [editMode, setEditMode] = useState(false);
  const [changePasswordMode, setChangePasswordMode] = useState(false);
  const [editProfile, setEditProfile] = useState({ ...userProfile });
  const [passwordData, setPasswordData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const navigate = useNavigate();
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  const currentUserId = currentUser?.userId;

  const fetchUserProfile = async () => {
    if (!currentUserId) {
      navigate('/login');
      return;
    }

    const token = localStorage.getItem('token');
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
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
      }
    }
  };

  useEffect(() => {
    fetchUserProfile();
  }, [navigate, currentUserId]);

  const handleAvatarUpload = async (event) => {
    const token = localStorage.getItem('token');
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
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
      } else {
        alert('Cập nhật avatar thất bại!');
      }
    }
  };

  const handleSaveProfile = async () => {
    const token = localStorage.getItem('token');
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
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
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

  const handleSavePassword = async () => {
    const token = localStorage.getItem('token');
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
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
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

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  };

  return (
    <div className="settings">
      <h3>Thông tin cá nhân</h3>
      <div className="profile-container">
        <div className="cover-container">
          {userProfile.coverPhoto ? (
            <img src={userProfile.coverPhoto} alt="Cover Photo" className="cover-photo" />
          ) : (
            <div className="cover-photo-placeholder">
              <p>Chưa có ảnh bìa</p>
            </div>
          )}
          <img
            src={userProfile.avatar || './assets/images/avatar.png'}
            alt="Avatar"
            className="avatar-profile"
          />
        </div>

        {editMode ? (
          <ProfileEdit
            editProfile={editProfile}
            setEditProfile={setEditProfile}
            handleAvatarUpload={handleAvatarUpload}
            handleSaveProfile={handleSaveProfile}
            handleCancelEdit={handleCancelEdit}
          />
        ) : changePasswordMode ? (
          <ChangePassword
            passwordData={passwordData}
            setPasswordData={setPasswordData}
            handleSavePassword={handleSavePassword}
            handleCancelPassword={handleCancelPassword}
          />
        ) : (
          <div className="profile-info">
            <p>
              <strong>Tên:</strong> {userProfile.name || 'Chưa cập nhật'}
            </p>
            <p>
              <strong>Số điện thoại:</strong>{' '}
              {userProfile.phoneNumber ? `+${userProfile.phoneNumber}` : 'Chưa cập nhật'}
            </p>
            <p>
              <strong>Ngày sinh:</strong> {userProfile.dateOfBirth || 'Chưa cập nhật'}
            </p>
            <p>
              <strong>Giới tính:</strong> {userProfile.gender || 'Chưa cập nhật'}
            </p>
            <button className="edit-btn" onClick={() => setEditMode(true)}>
              Chỉnh sửa thông tin
            </button>
            <button
              className="change-password-btn"
              onClick={() => {
                setChangePasswordMode(true);
                setEditMode(false);
              }}
            >
              Đổi mật khẩu
            </button>
          </div>
        )}
      </div>
      <button className="logout-btn" onClick={handleLogout}>
        Đăng xuất
      </button>
    </div>
  );
};

export default SettingsTab;