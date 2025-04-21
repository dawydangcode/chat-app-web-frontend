import React, { useState } from 'react';
import '../../assets/styles/ChatWindow.css';

const MessageInput = ({ onSendMessage }) => {
  const [content, setContent] = useState('');

  const handleSend = () => {
    if (!content.trim()) return;
    onSendMessage({ content, type: 'text' });
    setContent('');
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', 'file');
    formData.append('fileName', file.name);
    formData.append('mimeType', file.type);

    onSendMessage(formData);
  };

  return (
    <div className="message-input">
      <input
        type="text"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Nhập tin nhắn..."
        onKeyPress={(e) => e.key === 'Enter' && handleSend()}
      />
      <input type="file" onChange={handleFileUpload} />
      <button onClick={handleSend}>Gửi</button>
    </div>
  );
};

export default MessageInput;