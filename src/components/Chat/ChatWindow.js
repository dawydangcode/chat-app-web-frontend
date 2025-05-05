import React, { useState, useEffect } from 'react';
import axios from 'axios';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import CreateGroupModal from '../CreateGroupModal';
import '../../assets/styles/ChatWindow.css';
import { useNavigate } from 'react-router-dom';
import { VscLayoutSidebarRightOff } from 'react-icons/vsc';
import { AiOutlineUsergroupAdd } from 'react-icons/ai';
import { initializeSocket, getSocket } from '../../utils/socket';

const ChatWindow = ({ chat, toggleInfo, isInfoVisible }) => {
  const [messages, setMessages] = useState([]);
  const [messageCache, setMessageCache] = useState({}); // Cache để lưu trữ tin nhắn
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
      // Kiểm tra cache trước khi gọi API
      if (messageCache[chat.targetUserId]) {
        setMessages(messageCache[chat.targetUserId]);
        return;
      }

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
          // Lưu tin nhắn vào cache
          setMessageCache((prev) => ({
            ...prev,
            [chat.targetUserId]: fetchedMessages,
          }));
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
        alert(
          'Không thể kiểm tra trạng thái bạn bè do lỗi hệ thống. Giả định đây là người lạ để bạn có thể gửi lời mời kết bạn.'
        );
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

    let groupSocket, chatSocket;
    try {
      if (chat.isGroup) {
        groupSocket = initializeSocket(token, '/group');
        console.log('Group Socket initialized for /group:', groupSocket.id);
      }
      chatSocket = initializeSocket(token, '/chat');
      console.log('Chat Socket initialized for /chat:', chatSocket.id);
    } catch (error) {
      console.error('Socket not initialized:', error.message);
      navigate('/login');
      return;
    }

    if (chat.isGroup) {
      groupSocket.emit('joinRoom', { room: `user:${currentUserId}` });
      groupSocket.emit('joinRoom', { room: `group:${chat.targetUserId}` });

      groupSocket.on('newGroupMessage', (data) => {
        console.log('Received new group message:', data);
        if (data.groupId === chat.targetUserId && data.message.senderId !== currentUserId) {
          setMessages((prev) => {
            if (!Array.isArray(prev)) return [data.message];
            const existingMessageIndex = prev.findIndex(
              (msg) => msg.id === data.message.messageId || msg.messageId === data.message.messageId
            );
            if (existingMessageIndex !== -1) {
              return prev.map((msg, index) =>
                index === existingMessageIndex ? { ...data.message, id: data.message.messageId } : msg
              );
            }
            const updatedMessages = [...prev, data.message];
            // Cập nhật cache
            setMessageCache((prevCache) => ({
              ...prevCache,
              [chat.targetUserId]: updatedMessages,
            }));
            return updatedMessages;
          });
        }
      });

      chatSocket.on('messageRecalled', (data) => {
        console.log('Group message recalled:', data);
        setMessages((prev) => {
          if (!Array.isArray(prev)) return prev;
          const updatedMessages = prev.map((msg) =>
            (msg.id === data.messageId || msg.messageId === data.messageId)
              ? { ...msg, status: 'recalled' }
              : msg
          );
          // Cập nhật cache
          setMessageCache((prevCache) => ({
            ...prevCache,
            [chat.targetUserId]: updatedMessages,
          }));
          return updatedMessages;
        });
      });
    } else {
      chatSocket.emit('joinRoom', { room: `user:${currentUserId}` });

      chatSocket.on('receiveMessage', (newMessage) => {
        console.log('Received message:', newMessage);
        if (
          newMessage.senderId === chat.targetUserId ||
          newMessage.receiverId === chat.targetUserId
        ) {
          setMessages((prev) => {
            if (!Array.isArray(prev)) return [newMessage];
            const existingMessageIndex = prev.findIndex(
              (msg) => msg.id === newMessage.messageId || msg.messageId === newMessage.messageId
            );
            if (existingMessageIndex !== -1) {
              return prev.map((msg, index) =>
                index === existingMessageIndex ? { ...newMessage, id: newMessage.messageId } : msg
              );
            }
            const updatedMessages = [...prev, newMessage];
            // Cập nhật cache
            setMessageCache((prevCache) => ({
              ...prevCache,
              [chat.targetUserId]: updatedMessages,
            }));
            return updatedMessages;
          });
        }
      });

      chatSocket.on('messageStatus', ({ messageId, status }) => {
        setMessages((prev) => {
          if (!Array.isArray(prev)) return prev;
          const updatedMessages = prev.map((msg) =>
            (msg.id === messageId || msg.messageId === messageId) ? { ...msg, status } : msg
          );
          // Cập nhật cache
          setMessageCache((prevCache) => ({
            ...prevCache,
            [chat.targetUserId]: updatedMessages,
          }));
          return updatedMessages;
        });
      });

      chatSocket.on('messageRecalled', ({ messageId }) => {
        console.log('Message recalled:', { messageId });
        setMessages((prev) => {
          if (!Array.isArray(prev)) return prev;
          const updatedMessages = prev.map((msg) =>
            (msg.id === messageId || msg.messageId === messageId) ? { ...msg, status: 'recalled' } : msg
          );
          // Cập nhật cache
          setMessageCache((prevCache) => ({
            ...prevCache,
            [chat.targetUserId]: updatedMessages,
          }));
          return updatedMessages;
        });
      });

      chatSocket.on('messageDeleted', ({ messageId }) => {
        setMessages((prev) => {
          if (!Array.isArray(prev)) return prev;
          const updatedMessages = prev.filter((msg) => msg.id !== messageId && msg.messageId !== messageId);
          // Cập nhật cache
          setMessageCache((prevCache) => ({
            ...prevCache,
            [chat.targetUserId]: updatedMessages,
          }));
          return updatedMessages;
        });
      });

      chatSocket.on('user:status', ({ userId, status }) => {
        if (userId === chat.targetUserId) {
          console.log(`User ${userId} is now ${status}`);
        }
      });
    }

    return () => {
      if (chat.isGroup) {
        groupSocket.off('newGroupMessage');
        chatSocket.off('messageRecalled');
      } else {
        chatSocket.off('receiveMessage');
        chatSocket.off('messageStatus');
        chatSocket.off('messageRecalled');
        chatSocket.off('messageDeleted');
        chatSocket.off('user:status');
      }
    };
  }, [chat, currentUserId, token, navigate]);

  const handleSendMessage = async (data, onComplete) => {
    if (!currentUserId || !chat?.targetUserId || !token) {
      navigate('/login');
      onComplete?.();
      return;
    }

    const socketNamespace = chat.isGroup ? '/group' : '/chat';
    const eventName = chat.isGroup ? 'sendGroupMessage' : 'sendMessage';
    let socket;
    try {
      socket = getSocket(socketNamespace);
      console.log(`Socket retrieved for ${socketNamespace} namespace:`, socket.id);
    } catch (error) {
      console.error(`Socket not initialized for ${socketNamespace}:`, error.message);
      navigate('/login');
      onComplete?.();
      return;
    }

    if (data instanceof FormData) {
      try {
        const file = data.get('file');
        const messageData = {
          receiverId: chat.isGroup ? null : chat.targetUserId,
          groupId: chat.isGroup ? chat.targetUserId : null,
          type: data.get('type') || 'file',
          content: 'File attachment',
          file: {
            data: await file.arrayBuffer(),
            name: data.get('fileName'),
            mimeType: data.get('mimeType'),
          },
        };

        console.log(`Emitting ${eventName} with data:`, messageData);

        socket.emit(eventName, messageData, (response) => {
          console.log(`Received ${eventName} response:`, response);
          if (response.success) {
            setMessages((prev) => {
              if (!Array.isArray(prev)) return [response.data];
              const updatedMessages = [...prev, response.data];
              // Cập nhật cache
              setMessageCache((prevCache) => ({
                ...prevCache,
                [chat.targetUserId]: updatedMessages,
              }));
              return updatedMessages;
            });
          } else {
            alert(response.message);
          }
          onComplete?.();
        });
      } catch (error) {
        console.error('Error sending file:', error);
        alert('Không thể gửi file. Vui lòng thử lại.');
        onComplete?.();
      }
    } else {
      const messageData = {
        receiverId: chat.isGroup ? null : chat.targetUserId,
        groupId: chat.isGroup ? chat.targetUserId : null,
        type: data.type,
        content: data.content,
      };

      console.log(`Emitting ${eventName} with data:`, messageData);

      socket.emit(eventName, messageData, (response) => {
        console.log(`Received ${eventName} response:`, response);
        if (response.success) {
          setMessages((prev) => {
            if (!Array.isArray(prev)) return [response.data];
            const updatedMessages = [...prev, response.data];
            // Cập nhật cache
            setMessageCache((prevCache) => ({
              ...prevCache,
              [chat.targetUserId]: updatedMessages,
            }));
            return updatedMessages;
          });
        } else {
          alert(response.message);
        }
        onComplete?.();
      });
    }
  };

  const handleRecallMessage = async (messageId) => {
    let socket;
    try {
      socket = getSocket('/chat');
    } catch (error) {
      console.error('Socket not initialized for /chat:', error.message);
      alert('Không thể thu hồi tin nhắn. Vui lòng đăng nhập lại.');
      return;
    }

    socket.emit('recallMessage', { messageId }, (response) => {
      if (response.success) {
        setMessages((prev) => {
          if (!Array.isArray(prev)) return prev;
          const updatedMessages = prev.map((msg) =>
            (msg.id === messageId || msg.messageId === messageId)
              ? { ...msg, status: 'recalled' }
              : msg
          );
          // Cập nhật cache
          setMessageCache((prevCache) => ({
            ...prevCache,
            [chat.targetUserId]: updatedMessages,
          }));
          return updatedMessages;
        });
      } else {
        alert('Không thể thu hồi tin nhắn. Vui lòng thử lại.');
      }
    });
  };

  const handleDeleteMessage = async (messageId) => {
    if (chat.isGroup) {
      alert('Chức năng xóa tin nhắn nhóm hiện chưa được hỗ trợ.');
      return;
    }

    let socket;
    try {
      socket = getSocket('/chat');
    } catch (error) {
      console.error('Socket not initialized for /chat:', error.message);
      alert('Không thể xóa tin nhắn. Vui lòng đăng nhập lại.');
      return;
    }

    socket.emit('deleteMessage', { messageId }, (response) => {
      if (response.success) {
        setMessages((prev) => {
          if (!Array.isArray(prev)) return prev;
          const updatedMessages = prev.filter((msg) => msg.id !== messageId && msg.messageId !== messageId);
          // Cập nhật cache
          setMessageCache((prevCache) => ({
            ...prevCache,
            [chat.targetUserId]: updatedMessages,
          }));
          return updatedMessages;
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
      console.error('Socket not initialized for /chat:', error.message);
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

      if (response.data && response.data.success) {
        alert('Đã gửi yêu cầu kết bạn thành công!');
        setFriendStatus('pending_sent');
      } else {
        alert('Không thể gửi yêu cầu kết bạn: ' + (response.data?.error || 'Phản hồi không hợp lệ từ server.'));
      }
    } catch (error) {
      const errorMessage =
        error.response?.data?.error ||
        error.response?.data?.message ||
        'Lỗi hệ thống khi gửi yêu cầu kết bạn. Vui lòng thử lại sau.';
      alert('Lỗi khi gửi yêu cầu kết bạn: ' + errorMessage);
    }
  };

  const handleAcceptRequest = async () => {
    try {
      const response = await axios.get('http://localhost:3000/api/friends/received', {
        headers: { Authorization: `Bearer ${token.trim()}` },
      });

      if (!response.data || !Array.isArray(response.data)) {
        alert('Không tìm thấy danh sách lời mời kết bạn.');
        return;
      }

      const request = response.data.find((req) => req.senderId === chat.targetUserId);
      if (!request) {
        alert('Không tìm thấy lời mời kết bạn từ người này.');
        return;
      }

      const acceptResponse = await axios.post(
        'http://localhost:3000/api/friends/accept',
        {},
        {
          headers: { Authorization: `Bearer ${token.trim()}` },
          params: { requestId: request.requestId },
        }
      );

      if (acceptResponse.data && acceptResponse.data.success) {
        alert('Đã chấp nhận lời mời kết bạn!');
        setFriendStatus('friend');
      } else {
        alert('Không thể chấp nhận lời mời: ' + (acceptResponse.data?.message || 'Phản hồi không hợp lệ từ server.'));
      }
    } catch (error) {
      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.error ||
        'Lỗi hệ thống khi chấp nhận lời mời. Vui lòng thử lại sau.';
      alert('Lỗi khi chấp nhận lời mời: ' + errorMessage);
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
              <p>Người này đã gửi lời mời kết bạn</p>
              <button className="accept-friend-btn-banner" onClick={handleAcceptRequest}>
                Đồng ý
              </button>
            </>
          )}
          {friendStatus === 'blocked' && (
            <p>Bạn đã chặn người này. Hãy bỏ chặn để nhắn tin.</p>
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