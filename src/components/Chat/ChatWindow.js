import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import CreateGroupModal from '../CreateGroupModal';
import '../../assets/styles/ChatWindow.css';
import { useNavigate } from 'react-router-dom';
import { VscLayoutSidebarRightOff } from 'react-icons/vsc';
import { AiOutlineUsergroupAdd } from 'react-icons/ai';
import { initializeSocket, getSocket } from '../../utils/socket';
import { v4 as uuidv4 } from 'uuid';

const ChatWindow = ({ chat, toggleInfo, isInfoVisible, newMessageHighlights, unreadCounts }) => {
  const [messages, setMessages] = useState([]);
  const [messageCache, setMessageCache] = useState({});
  const [recentMessages, setRecentMessages] = useState([]);
  const [friendStatus, setFriendStatus] = useState(null);
  const [isCreateGroupModalOpen, setIsCreateGroupModalOpen] = useState(false);
  const navigate = useNavigate();
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  const currentUserId = currentUser?.userId;
  const token = localStorage.getItem('token');
  const chatSocketRef = useRef(null);
  const groupSocketRef = useRef(null);

  useEffect(() => {
    if (!currentUserId || !token || !chat?.targetUserId) {
      navigate('/login');
      return;
    }

    const fetchMessages = async (forceFetch = false) => {
      const shouldForceFetch = forceFetch || newMessageHighlights.has(chat.targetUserId) || (unreadCounts[chat.targetUserId] > 0);
      
      if (!shouldForceFetch && messageCache[chat.targetUserId]) {
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

    const markMessagesAsSeen = async () => {
      try {
        const response = await axios.get(
          `http://localhost:3000/api/messages/user/${chat.targetUserId}`,
          { headers: { Authorization: `Bearer ${token.trim()}` } }
        );

        if (response.data.success) {
          const unreadMessages = response.data.messages.filter(
            (msg) => msg.status === 'SENT' || msg.status === 'DELIVERED'
          );
          for (const msg of unreadMessages) {
            await axios.patch(
              `http://localhost:3000/api/messages/seen/${msg.messageId}`,
              {},
              { headers: { Authorization: `Bearer ${token.trim()}` } }
            );
          }
          console.log(`Messages marked as seen for chat ${chat.targetUserId}`);
        }
      } catch (error) {
        console.error('Error marking messages as seen:', error);
      }
    };

    // Khởi tạo hoặc lấy socket
    if (!chatSocketRef.current) {
      try {
        chatSocketRef.current = getSocket('/chat');
        console.log('Chat Socket initialized:', chatSocketRef.current.id);
      } catch (error) {
        console.error('Socket not initialized:', error.message);
        navigate('/login');
        return;
      }
    }

    if (chat.isGroup && !groupSocketRef.current) {
      try {
        groupSocketRef.current = getSocket('/group');
        console.log('Group Socket initialized:', groupSocketRef.current.id);
      } catch (error) {
        console.error('Socket not initialized:', error.message);
        navigate('/login');
        return;
      }
    }

    // Tham gia room mới khi thay đổi chat
    if (chatSocketRef.current) {
      chatSocketRef.current.emit('joinRoom', { room: `user:${currentUserId}` });
      if (chat.isGroup && groupSocketRef.current) {
        groupSocketRef.current.emit('joinRoom', { room: `group:${chat.targetUserId}` });
      } else if (chat.targetUserId) {
        chatSocketRef.current.emit('joinRoom', { room: `user:${chat.targetUserId}` });
      }
    }

    // Lắng nghe sự kiện
    const handleReceiveMessage = (newMessage) => {
      if (
        (newMessage.senderId === chat.targetUserId || newMessage.receiverId === chat.targetUserId) &&
        newMessage.senderId !== currentUserId
      ) {
        setMessages((prev) => {
          if (!Array.isArray(prev)) return [newMessage];
          const existingMessageIndex = prev.findIndex(
            (msg) => msg.tempId === newMessage.messageId || msg.messageId === newMessage.messageId
          );
          if (existingMessageIndex !== -1) {
            return prev.map((msg, index) =>
              index === existingMessageIndex ? { ...newMessage, id: newMessage.messageId } : msg
            );
          }
          const updatedMessages = [...prev, newMessage];
          setMessageCache((prevCache) => ({
            ...prevCache,
            [chat.targetUserId]: updatedMessages,
          }));
          return updatedMessages;
        });
      }
    };

    const handleMessageStatus = ({ messageId, status }) => {
      setMessages((prev) => {
        if (!Array.isArray(prev)) return prev;
        const updatedMessages = prev.map((msg) =>
          (msg.id === messageId || msg.messageId === messageId || msg.tempId === messageId)
            ? { ...msg, status }
            : msg
        );
        setMessageCache((prevCache) => ({
          ...prevCache,
          [chat.targetUserId]: updatedMessages,
        }));
        return updatedMessages;
      });
    };

    const handleMessageRecalled = ({ messageId }) => {
      setMessages((prev) => {
        if (!Array.isArray(prev)) return prev;
        const updatedMessages = prev.map((msg) =>
          (msg.id === messageId || msg.messageId === messageId || msg.tempId === messageId)
            ? { ...msg, status: 'recalled' }
            : msg
        );
        setMessageCache((prevCache) => ({
          ...prevCache,
          [chat.targetUserId]: updatedMessages,
        }));
        return updatedMessages;
      });
    };

    const handleMessageDeleted = ({ messageId }) => {
      setMessages((prev) => {
        if (!Array.isArray(prev)) return prev;
        const updatedMessages = prev.filter(
          (msg) => msg.id !== messageId && msg.messageId !== messageId && msg.tempId !== messageId
        );
        setMessageCache((prevCache) => ({
          ...prevCache,
          [chat.targetUserId]: updatedMessages,
        }));
        return updatedMessages;
      });
    };

    if (chatSocketRef.current) {
      chatSocketRef.current.on('receiveMessage', handleReceiveMessage);
      chatSocketRef.current.on('messageStatus', handleMessageStatus);
      chatSocketRef.current.on('messageRecalled', handleMessageRecalled);
      chatSocketRef.current.on('messageDeleted', handleMessageDeleted);
    }

    if (chat.isGroup && groupSocketRef.current) {
      groupSocketRef.current.on('newGroupMessage', handleReceiveMessage);
    }

    // Fetch data
    fetchMessages(true);
    fetchRecentChats();
    if (!chat?.isGroup) {
      fetchFriendStatus();
    } else {
      setFriendStatus(null);
    }
    markMessagesAsSeen();

    // Cleanup
    return () => {
      if (chatSocketRef.current) {
        chatSocketRef.current.off('receiveMessage', handleReceiveMessage);
        chatSocketRef.current.off('messageStatus', handleMessageStatus);
        chatSocketRef.current.off('messageRecalled', handleMessageRecalled);
        chatSocketRef.current.off('messageDeleted', handleMessageDeleted);
      }
      if (chat.isGroup && groupSocketRef.current) {
        groupSocketRef.current.off('newGroupMessage', handleReceiveMessage);
      }
    };
  }, [chat, currentUserId, token, navigate, newMessageHighlights, unreadCounts]);

  const handleSendMessage = async (data, onComplete) => {
    if (!currentUserId || !chat?.targetUserId || !token) {
      navigate('/login');
      onComplete?.();
      return;
    }

    const socketNamespace = chat.isGroup ? '/group' : '/chat';
    const eventName = chat.isGroup ? 'sendGroupMessage' : 'sendMessage';
    let socket = getSocket(socketNamespace);

    const tempId = uuidv4();
    const tempMessage = {
      tempId,
      senderId: currentUserId,
      receiverId: chat.isGroup ? null : chat.targetUserId,
      groupId: chat.isGroup ? chat.targetUserId : null,
      type: data instanceof FormData ? (data.get('type') || 'file') : data.type,
      content: data instanceof FormData ? 'File attachment' : data.content,
      status: 'pending',
      timestamp: new Date().toISOString(),
      fileName: data instanceof FormData ? data.get('fileName') : null,
      mimeType: data instanceof FormData ? data.get('mimeType') : null,
    };

    setMessages((prev) => {
      if (!Array.isArray(prev)) return [tempMessage];
      const updatedMessages = [...prev, tempMessage];
      setMessageCache((prevCache) => ({
        ...prevCache,
        [chat.targetUserId]: updatedMessages,
      }));
      return updatedMessages;
    });

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

        socket.emit(eventName, messageData, (response) => {
          setMessages((prev) => {
            if (!Array.isArray(prev)) return prev;
            if (response.success) {
              const updatedMessages = prev.map((msg) =>
                msg.tempId === tempId ? { ...response.data, id: response.data.messageId } : msg
              );
              setMessageCache((prevCache) => ({
                ...prevCache,
                [chat.targetUserId]: updatedMessages,
              }));
              return updatedMessages;
            } else {
              const updatedMessages = prev.map((msg) =>
                msg.tempId === tempId
                  ? { ...msg, status: 'error', errorMessage: response.message || 'Gửi file thất bại' }
                  : msg
              );
              setMessageCache((prevCache) => ({
                ...prevCache,
                [chat.targetUserId]: updatedMessages,
              }));
              console.log('Error sending file:', response.message || 'Unknown error');
              return updatedMessages;
            }
          });
          onComplete?.();
        });
      } catch (error) {
        console.error('Error sending file:', error);
        setMessages((prev) => {
          if (!Array.isArray(prev)) return prev;
          const updatedMessages = prev.map((msg) =>
            msg.tempId === tempId
              ? { ...msg, status: 'error', errorMessage: 'Không thể gửi file' }
              : msg
          );
          setMessageCache((prevCache) => ({
            ...prevCache,
            [chat.targetUserId]: updatedMessages,
          }));
          console.log('Error sending file:', error.message);
          return updatedMessages;
        });
        onComplete?.();
      }
    } else {
      const messageData = {
        receiverId: chat.isGroup ? null : chat.targetUserId,
        groupId: chat.isGroup ? chat.targetUserId : null,
        type: data.type,
        content: data.content,
      };

      socket.emit(eventName, messageData, (response) => {
        setMessages((prev) => {
          if (!Array.isArray(prev)) return prev;
          if (response.success) {
            const updatedMessages = prev.map((msg) =>
              msg.tempId === tempId ? { ...response.data, id: response.data.messageId } : msg
            );
            setMessageCache((prevCache) => ({
              ...prevCache,
              [chat.targetUserId]: updatedMessages,
            }));
            return updatedMessages;
          } else {
            const updatedMessages = prev.map((msg) =>
              msg.tempId === tempId
                ? { ...msg, status: 'error', errorMessage: response.message || 'Gửi tin nhắn thất bại' }
                : msg
            );
            setMessageCache((prevCache) => ({
              ...prevCache,
              [chat.targetUserId]: updatedMessages,
            }));
            console.log('Error sending message:', response.message || 'Unknown error');
            return updatedMessages;
          }
        });
        onComplete?.();
      });
    }
  };

  const handleRecallMessage = async (messageId) => {
    let socket = getSocket('/chat');
    socket.emit('recallMessage', { messageId }, (response) => {
      if (response.success) {
        setMessages((prev) => {
          if (!Array.isArray(prev)) return prev;
          const updatedMessages = prev.map((msg) =>
            (msg.id === messageId || msg.messageId === messageId || msg.tempId === messageId)
              ? { ...msg, status: 'recalled' }
              : msg
          );
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

    let socket = getSocket('/chat');
    socket.emit('deleteMessage', { messageId }, (response) => {
      if (response.success) {
        setMessages((prev) => {
          if (!Array.isArray(prev)) return prev;
          const updatedMessages = prev.filter(
            (msg) => msg.id !== messageId && msg.messageId !== messageId && msg.tempId !== messageId
          );
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
    let socket = getSocket('/chat');
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

  // Đảm bảo chat có các thuộc tính cần thiết
  const normalizedChat = {
    ...chat,
    userId: chat?.isGroup ? null : chat?.targetUserId,
    groupId: chat?.isGroup ? chat?.targetUserId : null,
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
        chat={normalizedChat}
      />
      <MessageInput onSendMessage={handleSendMessage} chat={normalizedChat} />

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