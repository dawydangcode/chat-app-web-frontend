import React, { useState, useEffect } from 'react';
import axios from 'axios';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import CreateGroupModal from '../CreateGroupModal';
import '../../assets/styles/ChatWindow.css';
import { useNavigate } from 'react-router-dom';
import { VscLayoutSidebarRightOff } from 'react-icons/vsc';
import { AiOutlineUsergroupAdd } from 'react-icons/ai';

const ChatWindow = ({ chat, toggleInfo, isInfoVisible }) => {
  const [messages, setMessages] = useState([]);
  const [recentMessages, setRecentMessages] = useState([]);
  const [friendStatus, setFriendStatus] = useState(null);
  const [isCreateGroupModalOpen, setIsCreateGroupModalOpen] = useState(false);
  const navigate = useNavigate();
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  const currentUserId = currentUser?.userId;

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
        const endpoint = chat.isGroup
          ? `http://localhost:3000/api/groups/messages/${chat.targetUserId}`
          : `http://localhost:3000/api/messages/user/${chat.targetUserId}`;

        const response = await axios.get(endpoint, {
          headers: { Authorization: `Bearer ${token.trim()}` },
        });

        console.log('Fetched messages response:', response.data);

        if (response.data.success) {
          const fetchedMessages = chat.isGroup ? response.data.data.messages || [] : response.data.messages || [];
          setMessages(fetchedMessages);
        } else {
          setMessages([]);
        }
      } catch (error) {
        console.error('Error fetching messages:', error);
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
          setRecentMessages(formattedChats);
        }
      } catch (error) {
        setRecentMessages([]);
      }
    };

    fetchMessages();
    fetchRecentChats();

    if (!chat?.isGroup) {
      fetchFriendStatus();
    } else {
      setFriendStatus(null);
    }
  }, [chat, navigate, currentUserId]);

  const handleSendMessage = async (data, onComplete) => {
    if (!currentUserId || !chat?.targetUserId) {
      navigate('/login');
      onComplete?.();
      return;
    }

    const token = localStorage.getItem('token');
    if (!token || !token.startsWith('eyJ')) {
      navigate('/login');
      onComplete?.();
      return;
    }

    let newMessage;
    let config = { headers: { Authorization: `Bearer ${token.trim()}` } };

    if (data instanceof FormData) {
      const messageType = data.get('type') || 'file';
      newMessage = {
        id: Date.now() + Math.random(),
        senderId: currentUserId,
        content: 'Đang tải file...',
        type: messageType,
        fileName: data.get('fileName'),
        mimeType: data.get('mimeType'),
        timestamp: new Date().toISOString(),
        status: 'pending',
      };

      const formDataEntries = {};
      for (let [key, value] of data.entries()) {
        formDataEntries[key] = value;
      }
      console.log('Sending FormData:', formDataEntries);

      if (chat.isGroup) {
        data.append('metadata', JSON.stringify({ systemMessage: false }));
      } else {
        data.append('receiverId', chat.targetUserId);
        data.append('content', 'File attachment');
        data.append('metadata', JSON.stringify({ systemMessage: false }));
      }
    } else {
      newMessage = {
        id: Date.now(),
        senderId: currentUserId,
        content: data.content,
        type: data.type,
        timestamp: new Date().toISOString(),
        status: 'pending',
      };
      if (chat.isGroup) {
        data = {
          type: data.type,
          content: data.content,
          metadata: { systemMessage: false },
        };
      } else {
        data = {
          receiverId: chat.targetUserId,
          type: data.type,
          content: data.content,
          metadata: JSON.stringify({ systemMessage: false }),
        };
      }
      config.headers['Content-Type'] = 'application/json';
    }

    setMessages((prev) => {
      if (!Array.isArray(prev)) {
        console.error('Previous messages state is not an array:', prev);
        return [newMessage];
      }
      return [...prev, newMessage];
    });

    try {
      const endpoint = chat.isGroup
        ? `http://localhost:3000/api/groups/messages/${chat.targetUserId}`
        : 'http://localhost:3000/api/messages/send';

      const response = await axios.post(endpoint, data, config);
      if (response.data.success) {
        setMessages((prev) => {
          if (!Array.isArray(prev)) {
            console.error('Previous messages state is not an array:', prev);
            return [
              {
                ...newMessage,
                id: response.data.data.messageId,
                content: response.data.data.content || newMessage.content,
                mediaUrl: response.data.data.mediaUrl,
                status: response.data.data.status || 'sent',
              },
            ];
          }
          return prev.map((msg) =>
            msg.id === newMessage.id
              ? {
                  ...msg,
                  id: response.data.data.messageId,
                  content: response.data.data.content || msg.content,
                  mediaUrl: response.data.data.mediaUrl,
                  status: response.data.data.status || 'sent',
                }
              : msg
          );
        });
      } else {
        throw new Error('Failed to send message: Server returned success=false');
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Không thể gửi file. Vui lòng thử lại.';
      console.error('Error sending message:', error.response?.data || error.message);
      setMessages((prev) => {
        if (!Array.isArray(prev)) {
          console.error('Previous messages state is not an array:', prev);
          return [{ ...newMessage, status: 'error' }];
        }
        return prev.map((msg) =>
          msg.id === newMessage.id
            ? { ...msg, status: 'error', errorMessage }
            : msg
        );
      });
      alert(errorMessage);
    } finally {
      onComplete?.();
    }
  };

  const handleRecallMessage = async (messageId) => {
    try {
      const token = localStorage.getItem('token');
      const endpoint = chat.isGroup
        ? `http://localhost:3000/api/groups/recall/messages/${chat.targetUserId}/${messageId}`
        : `http://localhost:3000/api/messages/recall/${messageId}`;

      const response = await axios[chat.isGroup ? 'put' : 'patch'](endpoint, {}, {
        headers: { Authorization: `Bearer ${token.trim()}` },
      });

      if (response.data.success) {
        setMessages((prev) => {
          if (!Array.isArray(prev)) {
            console.error('Previous messages state is not an array:', prev);
            return [];
          }
          return prev.map((msg) =>
            msg.id === messageId || msg.messageId === messageId
              ? { ...msg, status: 'recalled' }
              : msg
          );
        });
      }
    } catch (error) {
      console.error('Error recalling message:', error);
      alert('Không thể thu hồi tin nhắn. Vui lòng thử lại.');
    }
  };

  const handleDeleteMessage = async (messageId) => {
    try {
      const token = localStorage.getItem('token');
      const endpoint = chat.isGroup
        ? `http://localhost:3000/api/groups/messages/${chat.targetUserId}/${messageId}`
        : `http://localhost:3000/api/messages/${messageId}`;

      const response = await axios.delete(endpoint, {
        headers: { Authorization: `Bearer ${token.trim()}` },
      });

      if (response.data.success) {
        setMessages((prev) => {
          if (!Array.isArray(prev)) {
            console.error('Previous messages state is not an array:', prev);
            return [];
          }
          return prev.filter((msg) => msg.id !== messageId && msg.messageId !== messageId);
        });
      }
    } catch (error) {
      console.error('Error deleting message:', error);
      alert('Không thể xóa tin nhắn. Vui lòng thử lại.');
    }
  };

  const handleForwardMessage = async (messageId, targetUserId) => {
    try {
      const token = localStorage.getItem('token');
      const endpoint = chat.isGroup
        ? `http://localhost:3000/api/groups/forward-to-user`
        : `http://localhost:3000/api/messages/forward`;

      const payload = chat.isGroup
        ? { messageId, sourceGroupId: chat.targetUserId, targetReceiverId: targetUserId }
        : { messageId, targetReceiverId: targetUserId };

      const response = await axios.post(endpoint, payload, {
        headers: { Authorization: `Bearer ${token.trim()}` },
      });

      if (response.data.success) {
        return true;
      }
    } catch (error) {
      console.error('Error forwarding message:', error);
      alert('Không thể chuyển tiếp tin nhắn. Vui lòng thử lại.');
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

  const handleAddMemberClick = () => {
    if (chat.isGroup) {
      alert('Chức năng thêm thành viên nhóm sẽ được triển khai sau!');
    } else {
      setIsCreateGroupModalOpen(true);
    }
  };

  const handleGroupCreated = (newGroup) => {
    alert(`Nhóm "${newGroup.name}" đã được tạo thành công!`);
    setIsCreateGroupModalOpen(false);
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
        <div className="chat-header-actions">
          <button className="add-member-btn" onClick={handleAddMemberClick}>
            <AiOutlineUsergroupAdd size={30} />
          </button>
          <button className="toggle-info-btn-chat-header" onClick={toggleInfo}>
            <VscLayoutSidebarRightOff size={30} />
          </button>
        </div>
      </div>

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
        recentChats={recentMessages}
        onRecallMessage={handleRecallMessage}
        onDeleteMessage={handleDeleteMessage}
        onForwardMessage={handleForwardMessage}
        chat={chat}
      />
      <MessageInput onSendMessage={handleSendMessage} chat={chat} />

      <CreateGroupModal
        isOpen={isCreateGroupModalOpen}
        onClose={() => setIsCreateGroupModalOpen(false)}
        onGroupCreated={handleGroupCreated}
        preSelectedUser={chat?.isGroup ? null : chat?.targetUserId}
      />
    </div>
  );
};

export default ChatWindow;