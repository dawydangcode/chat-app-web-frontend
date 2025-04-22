import React, { useState, useEffect } from 'react';
import axios from 'axios';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import '../../assets/styles/ChatWindow.css';
import { useNavigate } from 'react-router-dom';

const ChatWindow = ({ chat, toggleInfo, isInfoVisible }) => {
  const [messages, setMessages] = useState([]);
  const [recentChats, setRecentChats] = useState([]);
  const navigate = useNavigate();
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  const currentUserId = currentUser?.userId;

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
        const response = await axios.get(
          `http://localhost:3000/api/messages/user/${chat.targetUserId}`,
          { headers: { Authorization: `Bearer ${token.trim()}` } }
        );
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
      data.append('receiverId', chat.targetUserId);
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
        receiverId: chat.targetUserId,
        type: data.type,
        content: data.content,
        metadata: JSON.stringify({ systemMessage: false }),
      };
      config.headers['Content-Type'] = 'application/json';
    }

    setMessages((prev) => [...prev, newMessage]);

    try {
      const response = await axios.post(
        'http://localhost:3000/api/messages/send',
        data,
        config
      );
      if (response.data.success) {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === newMessage.id
              ? {
                  ...msg,
                  id: response.data.data.messageId,
                  content: response.data.data.content || msg.content,
                  mediaUrl: response.data.data.mediaUrl,
                  status: response.data.data.status || 'sent', // Đảm bảo status được cập nhật
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
          <p>{chat?.phoneNumber ? `+${chat.phoneNumber}` : 'Chưa có số điện thoại'}</p>
        </div>
        <button className="toggle-info-btn" onClick={toggleInfo}>
          {isInfoVisible ? 'Ẩn thông tin' : 'Hiện thông tin'}
        </button>
      </div>
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