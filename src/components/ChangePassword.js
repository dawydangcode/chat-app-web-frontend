import React from 'react';
import '../assets/styles/Sidebar.css';

const ChangePassword = ({ passwordData, setPasswordData, handleSavePassword, handleCancelPassword }) => {
  return (
    <div className="profile-edit">
      <label>Mật khẩu cũ:</label>
      <input
        type="password"
        value={passwordData.oldPassword}
        onChange={(e) => setPasswordData({ ...passwordData, oldPassword: e.target.value })}
      />
      <label>Mật khẩu mới:</label>
      <input
        type="password"
        value={passwordData.newPassword}
        onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
      />
      <label>Nhập lại mật khẩu mới:</label>
      <input
        type="password"
        value={passwordData.confirmPassword}
        onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
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
  );
};

export default ChangePassword;