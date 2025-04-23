import React, { useState, useEffect } from 'react';
import axios from 'axios';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import CreateGroupModal from '../CreateGroupModal';
import '../../assets/styles/ChatWindow.css';
import { useNavigate } from 'react-router-dom';
import { VscLayoutSidebarRightOff } from 'react-icons/vsc';
import { AiOutlineUsergroupAdd } from 'react-icons/ai';
import { getSocket } from '../../utils/socket';

const ChatWindow = ({ chat, toggleInfo, isInfoVisible }) => {
  const [messages, setMessages] = useState([]);
  const [recentMessages, setRecentMessages] = useState([]);
  const [friendStatus, setFriendStatus] = useState(null);
  const [isCreateGroupModalOpen, setIsCreateGroupModalOpen] = useState(false);
  const navigate = useNavigate();
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  const currentUserId = currentUser?.userId;
  const token = localStorage.getItem('token');

  useEffect(() => {
    if (!currentUserId || !token || !chat?.targetUserId) {
      navigate('/login');
      return;
    }

    const fetchMessages = async () => {
      try {
        const endpoint = chat.isGroup
          ? `http://localhost:3000/api/groups/messages/${chat.targetUserId}`
          : `http://localhost:3000/api/messages/user/${chat.targetUserId}`;

        const response = await axios.get(endpoint, {
          headers: { Authorization: `Bearer ${token.trim()}` },
        });

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

    const fetchFriendStatus = async () => {
      if (chat.isGroup) return;

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

    fetchMessages();
    fetchRecentChats();
    if (!chat?.isGroup) {
      fetchFriendStatus();
    } else {
      setFriendStatus(null);
    }

    let socket;
    try {
      socket = getSocket('/chat');
    } catch (error) {
      console.error('Socket not initialized:', error.message);
      navigate('/login');
      return;
    }

    socket.emit('joinRoom', { room: chat.isGroup ? `group:${chat.targetUserId}` : `user:${chat.targetUserId}` });

    socket.on('receiveMessage', (newMessage) => {
      if (
        (chat.isGroup && newMessage.groupId === chat.targetUserId) ||
        (!chat.isGroup && (newMessage.senderId === chat.targetUserId || newMessage.receiverId === chat.targetUserId))
      ) {
        setMessages((prev) => {
          if (!Array.isArray(prev)) return [newMessage];
          // Kiểm tra xem tin nhắn đã tồn tại chưa (dựa trên messageId)
          const existingMessageIndex = prev.findIndex(
            (msg) => msg.id === newMessage.messageId || msg.messageId === newMessage.messageId
          );
          if (existingMessageIndex !== -1) {
            // Cập nhật tin nhắn hiện có
            return prev.map((msg, index) =>
              index === existingMessageIndex ? { ...newMessage, id: newMessage.messageId } : msg
            );
          }
          // Thêm tin nhắn mới nếu chưa tồn tại
          return [...prev, newMessage];
        });
      }
    });

    socket.on('messageStatus', ({ messageId, status }) => {
      setMessages((prev) => {
        if (!Array.isArray(prev)) return prev;
        return prev.map((msg) =>
          (msg.id === messageId || msg.messageId === messageId) ? { ...msg, status } : msg
        );
      });
    });

    socket.on('messageRecalled', ({ messageId }) => {
      setMessages((prev) => {
        if (!Array.isArray(prev)) return prev;
        return prev.map((msg) =>
          (msg.id === messageId || msg.messageId === messageId) ? { ...msg, status: 'recalled' } : msg
        );
      });
    });

    socket.on('messageDeleted', ({ messageId }) => {
      setMessages((prev) => {
        if (!Array.isArray(prev)) return prev;
        return prev.filter((msg) => msg.id !== messageId && msg.messageId !== messageId);
      });
    });

    socket.on('user:status', ({ userId, status }) => {
      if (userId === chat.targetUserId) {
        console.log(`User ${userId} is now ${status}`);
      }
    });

    return () => {
      socket.off('receiveMessage');
      socket.off('messageStatus');
      socket.off('messageRecalled');
      socket.off('messageDeleted');
      socket.off('user:status');
    };
  }, [chat, currentUserId, token, navigate]);

  const handleSendMessage = async (data, onComplete) => {
    if (!currentUserId || !chat?.targetUserId || !token) {
      navigate('/login');
      onComplete?.();
      return;
    }
  
    let socket;
    try {
      socket = getSocket('/chat');
      console.log('Socket retrieved for /chat namespace:', socket.id);
    } catch (error) {
      console.error('Socket not initialized:', error.message);
      navigate('/login');
      onComplete?.();
      return;
    }
  
    let newMessage;
  
    if (data instanceof FormData) {
      newMessage = {
        id: Date.now() + Math.random(), // ID tạm thời
        senderId: currentUserId,
        content: 'Đang tải file...',
        type: data.get('type') || 'file',
        fileName: data.get('fileName'),
        mimeType: data.get('mimeType'),
        timestamp: new Date().toISOString(),
        status: 'pending',
      };
  
      setMessages((prev) => {
        if (!Array.isArray(prev)) return [newMessage];
        return [...prev, newMessage];
      });
  
      try {
        const file = data.get('file');
        const messageData = {
          receiverId: chat.isGroup ? null : chat.targetUserId,
          groupId: chat.isGroup ? chat.targetUserId : null,
          type: newMessage.type,
          content: 'File attachment',
          file: {
            data: await file.arrayBuffer(),
            name: newMessage.fileName,
            mimeType: newMessage.mimeType,
          },
        };
  
        console.log('Emitting sendMessage with data:', messageData);
  
        socket.emit('sendMessage', messageData, (response) => {
          console.log('Received sendMessage response:', response);
          if (response.success) {
            setMessages((prev) => {
              if (!Array.isArray(prev)) return [response.data];
              return prev.map((msg) =>
                msg.id === newMessage.id
                  ? { ...response.data, id: response.data.messageId } // Cập nhật tin nhắn tạm thời
                  : msg
              );
            });
          } else {
            setMessages((prev) => {
              if (!Array.isArray(prev)) return [newMessage];
              return prev.map((msg) =>
                msg.id === newMessage.id
                  ? { ...msg, status: 'error', errorMessage: response.message }
                  : msg
              );
            });
            alert(response.message);
          }
          onComplete?.();
        });
      } catch (error) {
        console.error('Error sending file:', error);
        setMessages((prev) => {
          if (!Array.isArray(prev)) return [newMessage];
          return prev.map((msg) =>
            msg.id === newMessage.id
              ? { ...msg, status: 'error', errorMessage: 'Không thể gửi file.' }
              : msg
          );
        });
        alert('Không thể gửi file. Vui lòng thử lại.');
        onComplete?.();
      }
    } else {
      newMessage = {
        id: Date.now(), // ID tạm thời
        senderId: currentUserId,
        content: data.content,
        type: data.type,
        timestamp: new Date().toISOString(),
        status: 'pending',
      };
  
      setMessages((prev) => {
        if (!Array.isArray(prev)) return [newMessage];
        return [...prev, newMessage];
      });
  
      console.log('Emitting sendMessage with data:', {
        receiverId: chat.isGroup ? null : chat.targetUserId,
        groupId: chat.isGroup ? chat.targetUserId : null,
        type: data.type,
        content: data.content,
      });
  
      socket.emit(
        'sendMessage',
        {
          receiverId: chat.isGroup ? null : chat.targetUserId,
          groupId: chat.isGroup ? chat.targetUserId : null,
          type: data.type,
          content: data.content,
        },
        (response) => {
          console.log('Received sendMessage response:', response);
          if (response.success) {
            setMessages((prev) => {
              if (!Array.isArray(prev)) return [response.data];
              return prev.map((msg) =>
                msg.id === newMessage.id
                  ? { ...response.data, id: response.data.messageId } // Cập nhật tin nhắn tạm thời
                  : msg
              );
            });
          } else {
            setMessages((prev) => {
              if (!Array.isArray(prev)) return [newMessage];
              return prev.map((msg) =>
                msg.id === newMessage.id
                  ? { ...msg, status: 'error', errorMessage: response.message }
                  : msg
              );
            });
            alert(response.message);
          }
          onComplete?.();
        }
      );
    }
  };

  const handleRecallMessage = async (messageId) => {
    let socket;
    try {
      socket = getSocket('/chat');
    } catch (error) {
      console.error('Socket not initialized:', error.message);
      alert('Không thể thu hồi tin nhắn. Vui lòng đăng nhập lại.');
      return;
    }

    socket.emit('recallMessage', { messageId }, (response) => {
      if (response.success) {
        setMessages((prev) => {
          if (!Array.isArray(prev)) return prev;
          return prev.map((msg) =>
            (msg.id === messageId || msg.messageId === messageId)
              ? { ...msg, status: 'recalled' }
              : msg
          );
        });
      } else {
        alert('Không thể thu hồi tin nhắn. Vui lòng thử lại.');
      }
    });
  };

  const handleDeleteMessage = async (messageId) => {
    let socket;
    try {
      socket = getSocket('/chat');
    } catch (error) {
      console.error('Socket not initialized:', error.message);
      alert('Không thể xóa tin nhắn. Vui lòng đăng nhập lại.');
      return;
    }

    socket.emit('deleteMessage', { messageId }, (response) => {
      if (response.success) {
        setMessages((prev) => {
          if (!Array.isArray(prev)) return prev;
          return prev.filter((msg) => msg.id !== messageId && msg.messageId !== messageId);
        });
      } else {
        alert('Không thể xóa tin nhắn. Vui lòng thử lại.');
      }
    });
  };

  const handleForwardMessage = async (messageId, targetUserId) => {
    let socket;
    try {
      socket = getSocket('/chat');
    } catch (error) {
      console.error('Socket not initialized:', error.message);
      alert('Không thể chuyển tiếp tin nhắn. Vui lòng đăng nhập lại.');
      return;
    }

    socket.emit('forwardMessage', { messageId, targetReceiverId: targetUserId }, (response) => {
      if (!response.success) {
        alert('Không thể chuyển tiếp tin nhắn. Vui lòng thử lại.');
      }
    });
  };

  const handleAddFriendRequest = async () => {
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