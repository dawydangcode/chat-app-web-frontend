import React from 'react';
import '../assets/styles/Sidebar.css';

const ProfileEdit = ({
  editProfile,
  setEditProfile,
  handleAvatarUpload,
  handleSaveProfile,
  handleCancelEdit,
}) => {
  return (
    <div className="profile-edit">
      <input type="file" accept="image/*" onChange={handleAvatarUpload} className="avatar-upload" />
      <label>Tên:</label>
      <input
        type="text"
        value={editProfile.name}
        onChange={(e) => setEditProfile({ ...editProfile, name: e.target.value })}
      />
      <label>Ngày sinh:</label>
      <input
        type="date"
        value={editProfile.dateOfBirth || ''}
        onChange={(e) => setEditProfile({ ...editProfile, dateOfBirth: e.target.value })}
      />
      <label>Giới tính:</label>
      <select
        value={editProfile.gender}
        onChange={(e) => setEditProfile({ ...editProfile, gender: e.target.value })}
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
  );
};

export default ProfileEdit;