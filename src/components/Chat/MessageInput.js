import React, { useState, useRef, useEffect } from 'react';
import '../../assets/styles/MessageInput.css';
import { FaSmile, FaPaperPlane, FaImage, FaPaperclip } from 'react-icons/fa';

const MessageInput = ({ onSendMessage, chat }) => {
  const [content, setContent] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const textareaRef = useRef(null);

  const targetUser = chat?.name || 'Người dùng';

  // Tự động điều chỉnh chiều cao của textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  }, [content]);

  const handleSend = () => {
    if (!content.trim()) return;
    onSendMessage({ content, type: 'text' }, () => {});
    setContent('');
  };

  const handleFileUpload = async (e, isImageOnly = false) => {
  const files = Array.from(e.target.files);
  if (!files.length) return;

  setIsUploading(true);

  for (const file of files) {
    const maxSize = 100 * 1024 * 1024; // 100MB
    if (file.size > maxSize) {
      alert(`File ${file.name} quá lớn! Vui lòng chọn file nhỏ hơn 100MB.`);
      continue;
    }

    const allowedTypes = isImageOnly
      ? ['image/jpeg', 'image/png', 'image/gif', 'image/heic']
      : [
          'image/jpeg', 'image/png', 'image/gif', 'image/heic',
          'video/mp4', 'video/webm',
          'audio/mpeg', 'audio/wav', 'audio/mp4',
          'application/pdf', 'application/zip', 'application/x-rar-compressed', 'application/vnd.rar',
          'text/plain',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'application/vnd.ms-powerpoint',
          'application/vnd.openxmlformats-officedocument.presentationml.presentation',
          'application/vnd.ms-excel',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        ];

    if (!allowedTypes.includes(file.type)) {
      alert(`Định dạng file ${file.name} không được hỗ trợ! Vui lòng chọn ${isImageOnly ? 'ảnh' : 'ảnh, video, âm thanh, PDF hoặc file văn bản'}.`);
      continue;
    }

    let messageType = 'file'; // Mặc định cho tất cả file
    if (file.type.startsWith('image/')) {
      messageType = 'image';
    } else if (file.type.startsWith('video/')) {
      messageType = 'video';
    } else if (file.type.startsWith('audio/')) {
      messageType = 'voice';
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', messageType);
    formData.append('fileName', file.name);
    formData.append('mimeType', file.type);

    const formDataEntries = {};
    for (let [key, value] of formData.entries()) {
      formDataEntries[key] = value;
    }
    console.log('Sending file from MessageInput:', formDataEntries);

    await new Promise((resolve) => {
      onSendMessage(formData, () => resolve());
    });
  }

  setIsUploading(false);
};

  const handleStickerClick = () => {
    alert('Chức năng sticker sẽ được triển khai sau!');
  };

  return (
    <div className="message-input-wrapper">
      <div className="chatbox-bar-container">
        <div className="chatbox-bar">
          <button onClick={handleStickerClick} className="chatbox-bar-btn-emote">
            <FaSmile size={50} />
          </button>
          <label className="chatbox-bar-btn">
            <FaImage size={16} />
            <input
              type="file"
              onChange={(e) => handleFileUpload(e, true)}
              disabled={isUploading}
              multiple
              accept="image/jpeg,image/png,image/gif,image/heic"
              style={{ display: 'none' }}
            />
          </label>
          <label className="chatbox-bar-btn">
            <FaPaperclip size={16} />
            <input
              type="file"
              onChange={(e) => handleFileUpload(e, false)}
              disabled={isUploading}
              multiple
              accept="image/jpeg,image/png,image/gif,image/heic,video/mp4,video/webm,audio/mpeg,audio/wav,audio/mp4,application/pdf,application/zip,application/x-rar-compressed,application/vnd.rar,text/plain,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              style={{ display: 'none' }}
            />
          </label>
        </div>
      </div>
      <div className="chatinput-container">
        <div className="chatinput">
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={`Gửi tin nhắn tới ${targetUser}`}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            disabled={isUploading}
          />
          <button className="chatinput-emote-btn">
            <FaSmile size={16} />
          </button>
          <button onClick={handleSend} disabled={isUploading} className="chatinput-send-btn">
            <FaPaperPlane size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default MessageInput;