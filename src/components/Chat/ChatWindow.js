import React, { useState, useEffect } from 'react';
import axios from 'axios';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import '../../assets/styles/ChatWindow.css';
import { useNavigate } from 'react-router-dom';

const ChatWindow = ({ chat, onChatCreated }) => {
  const [messages, setMessages] = useState([]);
  const navigate = useNavigate();
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  const currentUserId = currentUser?.userId;

  useEffect(() => {
    const fetchMessages = async () => {
      console.log('🔍 Chat object:', chat);

      if (!currentUserId) {
        console.log('⚠️ currentUserId không tồn tại');
        alert('Không tìm thấy thông tin người dùng. Vui lòng đăng nhập lại.');
        navigate('/login');
        return;
      }

      if (!chat?.targetUserId) {
        console.log('⚠️ targetUserId không tồn tại');
        setMessages([]);
        return;
      }

      const token = localStorage.getItem('token');
      console.log('📌 Token:', token);
      if (!token || token === 'undefined' || !token.startsWith('eyJ')) {
        console.log('⚠️ Token không hợp lệ');
        alert('Vui lòng đăng nhập lại.');
        navigate('/login');
        return;
      }

      try {
        console.log('🌐 Gửi API request tới /api/messages/user/:userId');
        const response = await axios.get(
          `http://localhost:3000/api/messages/user/${chat.targetUserId}`,
          { headers: { Authorization: `Bearer ${token.trim()}` } }
        );
        console.log('📥 API response:', response.data);
        if (response.data.success) {
          setMessages(response.data.messages || []);
        } else {
          throw new Error(response.data.message || 'Lấy tin nhắn thất bại');
        }
      } catch (error) {
        console.error('❌ Lỗi khi lấy tin nhắn:', error);
        if (error.response?.status === 401) {
          alert('Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.');
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          navigate('/login');
        } else {
          alert(`Lấy tin nhắn thất bại: ${error.message}`);
        }
        setMessages([]);
      }
    };

    fetchMessages();
  }, [chat, navigate, currentUserId]);

  const handleSendMessage = async (content) => {
    console.log('📩 handleSendMessage gọi với:', content);
    console.log('🔍 currentUserId:', currentUserId);
    console.log('🔍 chat.targetUserId:', chat.targetUserId);

    if (!currentUserId) {
      console.log('⚠️ currentUserId không tồn tại');
      alert('Không tìm thấy thông tin người dùng. Vui lòng đăng nhập lại.');
      navigate('/login');
      return;
    }

    if (!chat?.targetUserId) {
      console.log('⚠️ chat.targetUserId không tồn tại');
      alert('Không thể gửi tin nhắn: Người nhận không hợp lệ.');
      return;
    }

    if (chat.targetUserId === currentUserId) {
      console.log('⚠️ Không thể gửi tin nhắn cho chính mình');
      alert('Bạn không thể gửi tin nhắn cho chính mình!');
      return;
    }

    const token = localStorage.getItem('token');
    console.log('🔐 Token:', token);

    if (!token || token === 'undefined' || !token.startsWith('eyJ')) {
      console.log('⚠️ Token không hợp lệ khi gửi tin nhắn');
      alert('Vui lòng đăng nhập để gửi tin nhắn.');
      navigate('/login');
      return;
    }

    const newMessage = {
      id: Date.now(),
      senderId: currentUserId,
      content,
      type: 'text',
      timestamp: new Date().toISOString(),
      status: 'pending',
    };

    console.log('📤 Cập nhật messages:', newMessage);
    setMessages((prevMessages) => [...prevMessages, newMessage]);

    try {
      console.log('🌐 Gửi API request tới /api/messages/send');
      const payload = {
        receiverId: chat.targetUserId,
        type: 'text',
        content,
        metadata: JSON.stringify({ systemMessage: false }),
      };
      console.log('📤 Payload:', payload);
      const response = await axios.post(
        'http://localhost:3000/api/messages/send',
        payload,
        { headers: { Authorization: `Bearer ${token.trim()}` } }
      );

      console.log('📥 API response:', response.data);

      if (response.data.success) {
        console.log('✅ Tin nhắn đã gửi:', response.data.data);
        setMessages((prevMessages) =>
          prevMessages.map((msg) =>
            msg.id === newMessage.id
              ? {
                  ...msg,
                  id: response.data.data.messageId,
                  senderId: response.data.data.senderId,
                  status: response.data.data.status,
                }
              : msg
          )
        );
      } else {
        if (
          response.data.message.includes(
            'Failed to update message status: The provided key element does not match the schema'
          )
        ) {
          console.log('⚠️ Bỏ qua lỗi updateMessageStatus, tin nhắn đã lưu');
          setMessages((prevMessages) =>
            prevMessages.map((msg) =>
              msg.id === newMessage.id ? { ...msg, status: 'sent' } : msg
            )
          );
        } else {
          throw new Error(response.data.message || 'Gửi tin nhắn thất bại');
        }
      }

      if (onChatCreated) {
        console.log('📣 Gọi onChatCreated để cập nhật chats');
        await onChatCreated();
      }
    } catch (error) {
      console.error('❌ Lỗi khi gửi tin nhắn:', error);
      if (error.response?.status === 403) {
        setMessages((prevMessages) =>
          prevMessages.map((msg) =>
            msg.id === newMessage.id ? { ...msg, status: 'restriced' } : msg
          )
        );
        alert('Không thể gửi tin nhắn do hạn chế tin nhắn từ người lạ.');
        if (onChatCreated) {
          await onChatCreated();
        }
      } else if (error.response?.status === 401) {
        alert('Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
      } else {
        if (
          error.response?.data?.message?.includes(
            'Failed to update message status: The provided key element does not match the schema'
          )
        ) {
          console.log('⚠️ Bỏ qua lỗi updateMessageStatus, tin nhắn đã lưu');
          setMessages((prevMessages) =>
            prevMessages.map((msg) =>
              msg.id === newMessage.id ? { ...msg, status: 'sent' } : msg
            )
          );
          if (onChatCreated) {
            console.log('📣 Gọi onChatCreated để cập nhật chats');
            await onChatCreated();
          }
        } else {
          setMessages((prevMessages) =>
            prevMessages.map((msg) =>
              msg.id === newMessage.id ? { ...msg, status: 'error' } : msg
            )
          );
          alert(`Gửi tin nhắn thất bại: ${error.message}`);
          if (onChatCreated) {
            await onChatCreated();
          }
        }
      }
    }
  };

  return (
    <div className="chat-window">
      <div className="chat-header">
        <img
          src={chat?.avatar || '/assets/images/avatar.png'}
          alt="Avatar"
          className="chat-avatar"
        />
        <div className="chat-info">
          <h3>{chat?.name || 'Không có tên'}</h3>
          <p>{chat?.phoneNumber ? `+${chat.phoneNumber}` : 'Chưa có số điện thoại'}</p>
        </div>
      </div>
      <MessageList messages={messages} />
      <MessageInput onSendMessage={handleSendMessage} />
    </div>
  );
};

export default ChatWindow;