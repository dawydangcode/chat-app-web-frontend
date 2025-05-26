import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../../assets/styles/ForwardMessageModal.css';

const ForwardMessageModal = ({ message, onForwardMessage, onClose }) => {
  const [conversations, setConversations] = useState([]);
  const [selectedConversations, setSelectedConversations] = useState([]);

  const fetchConversations = async () => {
    const token = localStorage.getItem('token');
    if (!token || !token.startsWith('eyJ')) {
      alert('Phiên đăng nhập không hợp lệ. Vui lòng đăng nhập lại.');
      return;
    }

    try {
      const response = await axios.get('http://localhost:3000/api/conversations/summary', {
        headers: { Authorization: `Bearer ${token.trim()}` },
      });

      if (response.data?.success) {
        const { conversations = [], groups = [] } = response.data.data;

        const formattedIndividualChats = conversations.map(conv => ({
          id: conv.otherUserId,
          name: conv.displayName || 'Không có tên',
          avatar: conv.avatar || 'https://placehold.co/50x50',
          isGroup: false,
        }));

        const formattedGroupChats = groups.map(group => ({
          id: group.groupId,
          name: group.name || 'Nhóm không tên',
          avatar: group.avatar || 'https://placehold.co/50x50',
          isGroup: true,
        }));

        const combinedChats = [...formattedIndividualChats, ...formattedGroupChats];
        setConversations(combinedChats);
      } else {
        alert('Không thể lấy danh sách hội thoại: ' + (response.data?.message || 'Lỗi hệ thống.'));
      }
    } catch (error) {
      console.error('Lỗi khi lấy danh sách hội thoại:', error);
      alert('Lỗi khi lấy danh sách hội thoại: ' + (error.response?.data?.message || error.message));
    }
  };

  useEffect(() => {
    fetchConversations();
  }, []);

  const handleSelectConversation = (conversation) => {
    setSelectedConversations(prev => {
      if (prev.some(conv => conv.id === conversation.id)) {
        return prev.filter(conv => conv.id !== conversation.id);
      } else {
        return [...prev, conversation];
      }
    });
  };

  const handleForward = () => {
    if (selectedConversations.length === 0) {
      alert('Vui lòng chọn ít nhất một cuộc trò chuyện để gửi.');
      return;
    }

    selectedConversations.forEach(conversation => {
      onForwardMessage(message.id || message.messageId, conversation.id);
    });
    onClose();
  };

  const getMessagePreview = () => {
    if (message.type === 'text') {
      return message.content;
    } else if (message.type === 'image' || message.type === 'video') {
      return `[${message.type === 'image' ? 'Hình ảnh' : 'Video'}]`;
    } else if (message.type === 'voice') {
      return '[Tin nhắn thoại]';
    } else if (message.type === 'file') {
      return `[Tệp: ${message.fileName || 'Không xác định'}]`;
    }
    return '[Không xác định]';
  };

  return (
    <div className="forward-modal">
      <div className="forward-modal-content">
        <h3>Chuyển tiếp tin nhắn</h3>
        <div className="message-preview">
          <p><strong>Tin nhắn:</strong> {getMessagePreview()}</p>
        </div>
        <div className="conversation-list">
          {conversations.length > 0 ? (
            conversations.map(conv => (
              <div
                key={conv.id}
                className={`conversation-item ${selectedConversations.some(c => c.id === conv.id) ? 'selected' : ''}`}
                onClick={() => handleSelectConversation(conv)}
              >
                <img
                  src={conv.avatar}
                  alt="Avatar"
                  className="conversation-avatar"
                  onError={(e) => {
                    console.log('Error loading avatar for conversation:', conv.id, conv.avatar);
                    e.target.src = 'https://placehold.co/50x50';
                  }}
                />
                <p className="conversation-name">{conv.name}</p>
              </div>
            ))
          ) : (
            <p>Chưa có cuộc trò chuyện nào.</p>
          )}
        </div>
        <div className="forward-modal-actions">
          <button className="forward-btn" onClick={handleForward} disabled={selectedConversations.length === 0}>
            Gửi
          </button>
          <button className="cancel-btn" onClick={onClose}>
            Hủy
          </button>
        </div>
      </div>
    </div>
  );
};

export default ForwardMessageModal;