import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../../assets/styles/ForwardMessageModal.css';

const ForwardMessageModal = ({ messageId, onForwardMessage, onClose }) => {
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const currentUserId = JSON.parse(localStorage.getItem('user') || '{}')?.userId;

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
    setSelectedConversation(conversation);
  };

  const handleForward = () => {
    if (!selectedConversation) {
      alert('Vui lòng chọn một cuộc trò chuyện để chuyển tiếp.');
      return;
    }

    onForwardMessage(messageId, selectedConversation.id);
    onClose();
  };

  return (
    <div className="forward-modal">
      <div className="forward-modal-content">
        <h3>Chuyển tiếp tin nhắn</h3>
        <div className="conversation-list">
          {conversations.length > 0 ? (
            conversations.map(conv => (
              <div
                key={conv.id}
                className={`conversation-item ${selectedConversation?.id === conv.id ? 'selected' : ''}`}
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
          <button className="forward-btn" onClick={handleForward} disabled={!selectedConversation}>
            Chuyển tiếp
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