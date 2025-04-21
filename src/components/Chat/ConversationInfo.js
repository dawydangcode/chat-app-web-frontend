import React from 'react';
import '../../assets/styles/ConversationInfo.css';

const ConversationInfo = ({ chat }) => {
  return (
    <div className="conversation-info">
      <div className="info-header">
        <img
          src={chat?.avatar || '/assets/images/placeholder.png'}
          alt="Avatar"
          className="info-avatar"
        />
        <h3>{chat?.name || 'Không có tên'}</h3>
      </div>
      <div className="info-section">
        <h4>Thông tin hội thoại</h4>
        <p>Tắt thông báo</p>
        <p>Bỏ ghim hội thoại</p>
        <p>Tạo nhóm trò chuyện</p>
      </div>
      <div className="info-section">
        <h4>Danh sách thành viên</h4>
        <p>4 thành viên chung</p>
      </div>
      <div className="info-section">
        <h4>Ảnh/Video</h4>
        <p>Chưa có Ảnh/Video được chia sẻ</p>
      </div>
      <div className="info-section">
        <h4>File</h4>
        <p>Chưa có File được chia sẻ</p>
      </div>
      <div className="info-section">
        <h4>Link</h4>
        <p>Chưa có Link được chia sẻ</p>
      </div>
    </div>
  );
};

export default ConversationInfo;