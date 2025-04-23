import React, { useState, useEffect } from 'react';
import axios from 'axios';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import '../../assets/styles/ChatWindow.css';
import { useNavigate } from 'react-router-dom';

const ChatWindow = ({ chat, toggleInfo, isInfoVisible }) => {
  const [messages, setMessages] = useState([]);
  const [recentChats, setRecentChats] = useState([]);
  const [friendStatus, setFriendStatus] = useState(null); // Trạng thái kết bạn
  const navigate = useNavigate();
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  const currentUserId = currentUser?.userId;

  // Lấy trạng thái kết bạn (chỉ gọi nếu không phải nhóm chat)
  const fetchFriendStatus = async () => {
    if (!currentUserId || !chat?.targetUserId) return;

    const token = localStorage.getItem('token');
    if (!token || !token.startsWith('eyJ')) return;

    try {
      const response = await axios.get(
        `http://localhost:3000/api/friends/status/${chat.targetUserId}`,
        { headers: { Authorization: `Bearer ${token.trim()}` } }
      );

      if (response.data && response.data.status) {
        setFriendStatus(response.data.status);
      } else {
        setFriendStatus('stranger');
      }
    } catch (error) {
      console.error('Error fetching friend status:', error);
      setFriendStatus('stranger');
    }
  };

  useEffect(() => {
    const fetchMessages = async () => {
      if (!currentUserId || !chat?.targetUserId) {
        navigate('/login');
        return;
      }

      const token = localStorage.getItem('token');
      if (!token || !token.startsWith('eyJ')) {
        navigate('/login');
        return;
      }

      try {
        // Nếu là nhóm chat, gọi API lấy tin nhắn nhóm
        const endpoint = chat.isGroup
          ? `http://localhost:3000/api/messages/group/${chat.targetUserId}`
          : `http://localhost:3000/api/messages/user/${chat.targetUserId}`;

        const response = await axios.get(endpoint, {
          headers: { Authorization: `Bearer ${token.trim()}` },
        });

        if (response.data.success) {
          setMessages(response.data.messages || []);
        }
      } catch (error) {
        if (error.response?.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          navigate('/login');
        }
        setMessages([]);
      }
    };

    const fetchRecentChats = async () => {
      const token = localStorage.getItem('token');
      if (!token || !token.startsWith('eyJ')) {
        return;
      }

      try {
        const response = await axios.get('http://localhost:3000/api/conversations/summary', {
          headers: { Authorization: `Bearer ${token.trim()}` },
        });
        if (response.data.success) {
          const conversations = response.data.data?.conversations || [];
          const formattedChats = conversations.map((conv) => ({
            id: conv.otherUserId,
            name: conv.displayName || 'Không có tên',
          }));
          setRecentChats(formattedChats);
        }
      } catch (error) {
        setRecentChats([]);
      }
    };

    fetchMessages();
    fetchRecentChats();

    // Chỉ lấy trạng thái kết bạn nếu không phải nhóm chat
    if (!chat?.isGroup) {
      fetchFriendStatus();
    } else {
      setFriendStatus(null); // Đặt friendStatus về null nếu là nhóm chat
    }
  }, [chat, navigate, currentUserId]);

  const handleSendMessage = async (data) => {
    if (!currentUserId || !chat?.targetUserId) {
      navigate('/login');
      return;
    }

    const token = localStorage.getItem('token');
    if (!token || !token.startsWith('eyJ')) {
      navigate('/login');
      return;
    }

    let newMessage;
    let config = { headers: { Authorization: `Bearer ${token.trim()}` } };

    if (data instanceof FormData) {
      newMessage = {
        id: Date.now(),
        senderId: currentUserId,
        content: 'Đang tải file...',
        type: data.get('type'),
        fileName: data.get('fileName'),
        mimeType: data.get('mimeType'),
        timestamp: new Date().toISOString(),
        status: 'pending',
      };
      if (chat.isGroup) {
        data.append('groupId', chat.targetUserId);
      } else {
        data.append('receiverId', chat.targetUserId);
      }
      data.append('metadata', JSON.stringify({ systemMessage: false }));
    } else {
      newMessage = {
        id: Date.now(),
        senderId: currentUserId,
        content: data.content,
        type: data.type,
        timestamp: new Date().toISOString(),
        status: 'pending',
      };
      data = {
        ...(chat.isGroup ? { groupId: chat.targetUserId } : { receiverId: chat.targetUserId }),
        type: data.type,
        content: data.content,
        metadata: JSON.stringify({ systemMessage: false }),
      };
      config.headers['Content-Type'] = 'application/json';
    }

    setMessages((prev) => [...prev, newMessage]);

    try {
      const endpoint = chat.isGroup
        ? 'http://localhost:3000/api/messages/send-to-group'
        : 'http://localhost:3000/api/messages/send';

      const response = await axios.post(endpoint, data, config);
      if (response.data.success) {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === newMessage.id
              ? {
                  ...msg,
                  id: response.data.data.messageId,
                  content: response.data.data.content || msg.content,
                  mediaUrl: response.data.data.mediaUrl,
                  status: response.data.data.status || 'sent',
                }
              : msg
          )
        );
      }
    } catch (error) {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === newMessage.id ? { ...msg, status: 'error' } : msg
        )
      );
    }
  };

  const handleRecallMessage = async (messageId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.patch(
        `http://localhost:3000/api/messages/recall/${messageId}`,
        {},
        { headers: { Authorization: `Bearer ${token.trim()}` } }
      );
      if (response.data.success) {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === messageId || msg.messageId === messageId
              ? { ...msg, status: 'recalled' }
              : msg
          )
        );
      }
    } catch (error) {}
  };

  const handleDeleteMessage = async (messageId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.delete(
        `http://localhost:3000/api/messages/${messageId}`,
        { headers: { Authorization: `Bearer ${token.trim()}` } }
      );
      if (response.data.success) {
        setMessages((prev) =>
          prev.filter((msg) => msg.id !== messageId && msg.messageId !== messageId)
        );
      }
    } catch (error) {}
  };

  const handleForwardMessage = async (messageId, targetUserId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `http://localhost:3000/api/messages/forward`,
        { messageId, targetReceiverId: targetUserId },
        { headers: { Authorization: `Bearer ${token.trim()}` } }
      );
      if (response.data.success) {
        return true;
      }
    } catch (error) {
      return false;
    }
  };

  const handleAddFriendRequest = async () => {
    const token = localStorage.getItem('token');
    try {
      const response = await axios.post(
        'http://localhost:3000/api/friends/send',
        { receiverId: chat.targetUserId, message: `Xin chào, mình là ${currentUser.name}, hãy kết bạn với mình nhé!` },
        { headers: { Authorization: `Bearer ${token.trim()}` } }
      );

      if (response.data && response.data.message) {
        alert('Đã gửi yêu cầu kết bạn thành công!');
        setFriendStatus('pending_sent');
      } else {
        alert('Không thể gửi yêu cầu kết bạn.');
      }
    } catch (error) {
      alert('Lỗi khi gửi yêu cầu kết bạn: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleAcceptRequest = async () => {
    const token = localStorage.getItem('token');
    try {
      const response = await axios.get('http://localhost:3000/api/friends/received', {
        headers: { Authorization: `Bearer ${token.trim()}` },
      });

      const request = response.data.find((req) => req.senderId === chat.targetUserId);
      if (!request) {
        alert('Không tìm thấy lời mời kết bạn.');
        return;
      }

      const acceptResponse = await axios.post(
        'http://localhost:3000/api/friends/accept',
        { requestId: request.requestId },
        { headers: { Authorization: `Bearer ${token.trim()}` } }
      );

      if (acceptResponse.data && acceptResponse.data.message) {
        alert('Đã chấp nhận lời mời kết bạn!');
        setFriendStatus('friend');
      }
    } catch (error) {
      alert('Lỗi khi chấp nhận lời mời: ' + (error.response?.data?.message || error.message));
    }
  };

  return (
    <div className="chat-window">
      <div className="chat-header">
        <img
          src={chat?.avatar || '/assets/images/placeholder.png'}
          alt="Avatar"
          className="chat-avatar"
        />
        <div className="chat-info">
          <h3>{chat?.name || 'Không có tên'}</h3>
          <p>{chat?.phoneNumber && !chat.isGroup ? `+${chat.phoneNumber}` : chat.isGroup ? 'Nhóm chat' : 'Chưa có số điện thoại'}</p>
        </div>
        <button className="toggle-info-btn" onClick={toggleInfo}>
          {isInfoVisible ? 'Ẩn thông tin' : 'Hiện thông tin'}
        </button>
      </div>
      {/* Chỉ hiển thị banner nếu không phải nhóm chat và có trạng thái kết bạn */}
      {!chat?.isGroup && friendStatus && friendStatus !== 'friend' && (
        <div className="friend-status-banner">
          {friendStatus === 'stranger' && (
            <>
              <p>Gửi yêu cầu kết bạn tới người này</p>
              <button className="add-friend-btn-banner" onClick={handleAddFriendRequest}>
                Gửi kết bạn
              </button>
            </>
          )}
          {friendStatus === 'pending_sent' && (
            <p>Bạn đã gửi yêu cầu kết bạn và đang chờ người này đồng ý</p>
          )}
          {friendStatus === 'pending_received' && (
            <>
              <p>Đang chờ được đồng ý kết bạn</p>
              <button className="accept-friend-btn-banner" onClick={handleAcceptRequest}>
                Đồng ý
              </button>
            </>
          )}
        </div>
      )}
      <MessageList
        messages={messages}
        recentChats={recentChats}
        onRecallMessage={handleRecallMessage}
        onDeleteMessage={handleDeleteMessage}
        onForwardMessage={handleForwardMessage}
      />
      <MessageInput onSendMessage={handleSendMessage} />
    </div>
  );
};

export default ChatWindow;