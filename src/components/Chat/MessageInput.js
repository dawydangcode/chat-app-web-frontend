import React, { useState } from 'react';
import '../../assets/styles/ChatWindow.css';

const MessageInput = ({ onSendMessage }) => {
  const [content, setContent] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  const handleSend = () => {
    if (!content.trim()) return;
    onSendMessage({ content, type: 'text' }, () => {});
    setContent('');
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Kiểm tra kích thước file (giới hạn 100MB)
    const maxSize = 100 * 1024 * 1024; // 100MB
    if (file.size > maxSize) {
      alert('File quá lớn! Vui lòng chọn file nhỏ hơn 100MB.');
      return;
    }

    // Kiểm tra định dạng file
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'video/mp4',
      'video/webm',
      'application/pdf',
      'application/zip',
    ];
    if (!allowedTypes.includes(file.type)) {
      alert('Định dạng file không được hỗ trợ! Vui lòng chọn ảnh, video, PDF hoặc ZIP.');
      return;
    }

    // Xác định type dựa trên mimeType
    let messageType = 'file'; // Giá trị mặc định
    if (file.type.startsWith('image/')) {
      messageType = 'image';
    } else if (file.type.startsWith('video/')) {
      messageType = 'video';
    } else if (file.type === 'application/pdf') {
      messageType = 'pdf';
    } else if (file.type === 'application/zip') {
      messageType = 'zip';
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', messageType); // Sử dụng type dựa trên mimeType
    formData.append('fileName', file.name);
    formData.append('mimeType', file.type);

    const formDataEntries = {};
    for (let [key, value] of formData.entries()) {
      formDataEntries[key] = value;
    }
    console.log('Sending file from MessageInput:', formDataEntries);

    setIsUploading(true);
    onSendMessage(formData, () => setIsUploading(false));
  };

  return (
    <div className="message-input">
      <input
        type="text"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Nhập tin nhắn..."
        onKeyPress={(e) => e.key === 'Enter' && handleSend()}
        disabled={isUploading}
      />
      <input
        type="file"
        onChange={handleFileUpload}
        disabled={isUploading}
      />
      <button onClick={handleSend} disabled={isUploading}>
        {isUploading ? 'Đang gửi...' : 'Gửi'}
      </button>
    </div>
  );
};

export default MessageInput;