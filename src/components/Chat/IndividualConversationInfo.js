import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import '../../assets/styles/ConversationInfo.css';
import { FaImages, FaFileAlt, FaLink, FaLock, FaDownload, FaShare, FaEllipsisH, FaBellSlash, FaUsers, FaPen } from 'react-icons/fa';
import { LuPin, LuPinOff } from 'react-icons/lu';
import { MdToggleOff, MdToggleOn } from 'react-icons/md';
import { BiSolidRightArrow, BiSolidDownArrow } from "react-icons/bi";
import { LiaStopwatchSolid } from "react-icons/lia";
import { IoWarningOutline } from "react-icons/io5";
import { VscTrash } from "react-icons/vsc";


// Hàm tính thời gian gửi file
const getTimeDifference = (timestamp) => {
  if (!timestamp) return '';
  const now = new Date();
  const fileTime = new Date(timestamp);
  const diffInSeconds = Math.floor((now - fileTime) / 1000);

  if (diffInSeconds < 10) return 'Vài giây';
  else if (diffInSeconds < 60) return `${diffInSeconds} giây`;
  else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes} phút`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours} giờ`;
  } else if (diffInSeconds < 604800) {
    const days = Math.floor(diffInSeconds / 86400);
    return days === 1 ? 'Hôm qua' : `${days} ngày trước`;
  } else if (diffInSeconds < 691200) return '7 ngày trước';
  else {
    return fileTime.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  }
};

const IndividualConversationInfo = ({ chat }) => {
  const [mediaFiles, setMediaFiles] = useState([]);
  const [files, setFiles] = useState([]);
  const [expandedSections, setExpandedSections] = useState({
    media: true,
    files: true,
    links: true,
    security: true,
  });
  const [error, setError] = useState(null);
  const [contextMenu, setContextMenu] = useState(null);
  const [isMuted, setIsMuted] = useState(false); // Trạng thái tắt thông báo
  const [isHidden, setIsHidden] = useState(false); // Trạng thái ẩn trò chuyện
  const [showNicknameModal, setShowNicknameModal] = useState(false); // Trạng thái modal đổi nickname
  const [nickname, setNickname] = useState(chat?.name || 'Không có tên'); // Nickname hiện tại
  const contextMenuRef = useRef(null);

  const token = localStorage.getItem('token');

  const toggleSection = (section) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const fetchMessages = async () => {
    if (!chat?.targetUserId) {
      setError('Không có thông tin hội thoại.');
      return;
    }

    try {
      const response = await axios.get(
        `http://localhost:3000/api/messages/user/${chat.targetUserId}?limit=100`,
        {
          headers: { Authorization: `Bearer ${token.trim()}` },
        }
      );

      if (response.data.success) {
        const messages = response.data.messages || [];
        messages.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        const media = messages
          .filter((msg) => ['image', 'video'].includes(msg.type) && msg.mediaUrl)
          .map((msg) => ({
            type: msg.type,
            url: msg.mediaUrl,
            fileName: msg.fileName || `media_${msg.messageId}`,
            timestamp: msg.timestamp,
          }));

        const otherFiles = messages
          .filter((msg) => msg.type === 'file' && msg.mediaUrl)
          .map((msg) => ({
            type: msg.type,
            url: msg.mediaUrl,
            fileName: msg.fileName || `file_${msg.messageId}`,
            timestamp: msg.timestamp,
          }));

        console.log('Media files fetched:', media);
        console.log('Other files fetched:', otherFiles);

        setMediaFiles(media);
        setFiles(otherFiles);
        setError(null);
      } else {
        setError('Không thể lấy tin nhắn từ server.');
        setMediaFiles([]);
        setFiles([]);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
      setError(`Lỗi khi lấy dữ liệu: ${error.response?.data?.message || error.message}`);
      setMediaFiles([]);
      setFiles([]);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, [chat?.targetUserId]);

  const handleViewAllMedia = () => {
    alert('Chức năng xem tất cả sẽ được triển khai sau!');
  };

  const handleViewAllFiles = () => {
    alert('Chức năng xem tất cả file sẽ được triển khai sau!');
  };

  // Hàm xác định icon dựa trên tên file
  const getFileIcon = (fileName) => {
    const extension = fileName.split('.').pop().toLowerCase();
    switch (extension) {
      case 'pdf':
        return 'https://chat.zalo.me/assets/icon-pdf.51cd88ff166552930d03701ff5cbd1d8.svg';
      case 'doc':
      case 'docx':
        return 'https://chat.zalo.me/assets/icon-pdf.51cd88ff166552930d03701ff5cbd1d8.svg';
      case 'xls':
      case 'xlsx':
        return 'https://chat.zalo.me/assets/icon-pdf.51cd88ff166552930d03701ff5cbd1d8.svg';
      default:
        return 'https://chat.zalo.me/assets/icon-pdf.51cd88ff166552930d03701ff5cbd1d8.svg';
    }
  };

  const handleShareFile = (file) => {
    alert(`Chuyển tiếp file: ${file.fileName} (Chức năng sẽ được triển khai sau!)`);
    // Logic chuyển tiếp file sẽ được tích hợp ở đây
  };

  const handleContextMenu = (event, file) => {
    event.preventDefault();
    event.stopPropagation();
    const { clientX, clientY } = event;
    setContextMenu({
      x: clientX,
      y: clientY,
      file,
    });
  };

  const handleContextMenuAction = (action, file) => {
    switch (action) {
      case 'delete':
        alert(`Xóa file: ${file.fileName} (Chức năng sẽ được triển khai sau!)`);
        break;
      case 'copyLink':
        navigator.clipboard.writeText(file.url).then(() => {
          alert('Đã sao chép liên kết file!');
        }).catch(() => {
          alert('Không thể sao chép liên kết!');
        });
        break;
      default:
        break;
    }
    setContextMenu(null);
  };

  const handleMuteNotifications = () => {
    setIsMuted(!isMuted);
    alert(`${isMuted ? 'Bật' : 'Tắt'} thông báo (Chức năng sẽ được triển khai sau!)`);
    // Logic tắt/bật thông báo sẽ được tích hợp ở đây
  };

  const handlePinConversation = () => {
    if (chat.isPinned) {
      chat.onUnpinConversation();
    } else {
      chat.onPinConversation();
    }
  };

  const handleCreateGroupChat = () => {
    alert('Tạo nhóm trò chuyện (Chức năng sẽ được triển khai sau!)');
    // Logic tạo nhóm trò chuyện sẽ được tích hợp ở đây
  };

  const handleChangeNickname = () => {
    const newNickname = prompt('Nhập nickname mới:', nickname);
    if (newNickname && newNickname.trim() !== '') {
      setNickname(newNickname.trim());
      alert(`Đã đổi nickname thành: ${newNickname} (Chức năng sẽ được triển khai sau!)`);
      // Logic lưu nickname vào backend sẽ được tích hợp ở đây
    }
    setShowNicknameModal(false);
  };

  const handleToggleHideChat = () => {
    setIsHidden(!isHidden);
    alert(`${isHidden ? 'Hiện' : 'Ẩn'} trò chuyện (Chức năng sẽ được triển khai sau!)`);
    // Logic ẩn/hiện trò chuyện sẽ được tích hợp ở đây
  };

  const handleAutoDeleteMessages = () => {
    alert('Chức năng tin nhắn tự xóa sẽ được triển khai sau!');
    // Logic thiết lập tin nhắn tự xóa sẽ được tích hợp ở đây
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (contextMenuRef.current && !contextMenuRef.current.contains(event.target)) {
        setContextMenu(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const recentMediaFiles = mediaFiles.slice(0, 6);
  const recentFiles = files.slice(0, 3);

  return (
    <div className="conversation-info">
      <div className="chat-info-header">
        <h4>Thông tin hội thoại</h4>
      </div>
      <div className="info-header">
        <img
          src={chat?.avatar || '/assets/images/placeholder.png'}
          alt="User Avatar"
          className="info-avatar"
        />
        <div className="group-name-container">
          <h3>{nickname}</h3>
          <button className="edit-nickname-btn" onClick={() => setShowNicknameModal(true)} title="Đổi nickname">
            <FaPen size={14} />
          </button>
        </div>
        <div className="header-actions">
          <button className="header-action-btn" onClick={handleMuteNotifications} title={isMuted ? "Bật thông báo" : "Tắt thông báo"}>
            <FaBellSlash size={18} />
          </button>
          <button
            className={`header-action-btn ${chat?.isPinned ? 'header-action-btn--pinned' : ''}`}
            onClick={handlePinConversation}
            title={chat?.isPinned ? "Bỏ ghim hội thoại" : "Ghim hội thoại"}
          >
            {chat?.isPinned ? <LuPinOff size={18} /> : <LuPin size={18} />}
          </button>
          <button className="header-action-btn" onClick={handleCreateGroupChat} title="Tạo nhóm trò chuyện">
            <FaUsers size={18} />
          </button>
        </div>
      </div>

      {error && (
        <div className="error-message">
          <p>{error}</p>
        </div>
      )}

      {/* Section: Ảnh/Video */}
      <div className="info-section">
        <h4 onClick={() => toggleSection('media')} className="section-title">
          Ảnh/Video {expandedSections.media ? <BiSolidDownArrow size={13} color='#5a6981'/> : <BiSolidRightArrow size={13} color='#5a6981'/>}
        </h4>
        {expandedSections.media && (
          <div className="section-content">
            {mediaFiles.length > 0 ? (
              <>
                <div className="media-grid">
                  {recentMediaFiles.map((media, index) => (
                    <div key={index} className="media-item">
                      {media.type === 'image' ? (
                        <img src={media.url} alt={media.fileName} onError={(e) => e.target.src = '/assets/images/placeholder.png'} />
                      ) : (
                        <video src={media.url} controls onError={(e) => console.error('Video load error:', media.url)} />
                      )}
                    </div>
                  ))}
                </div>
                {mediaFiles.length > 6 && (
                  <button className="view-all-btn" onClick={handleViewAllMedia}>
                    Xem tất cả
                  </button>
                )}
              </>
            ) : (
              <p>Chưa có ảnh hoặc video được chia sẻ.</p>
            )}
          </div>
        )}
      </div>

      {/* Section: File */}
      <div className="info-section">
        <h4 onClick={() => toggleSection('files')} className="section-title">
          File {expandedSections.files ? <BiSolidDownArrow size={13} color='#5a6981'/> : <BiSolidRightArrow size={13} color='#5a6981'/>}
        </h4>
        {expandedSections.files && (
          <div className="section-content">
            {files.length > 0 ? (
              <>
                <div className="file-list">
                  {recentFiles.map((file, index) => (
                    <div key={index} className="file-item-wrapper">
                      <a
                        href={file.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="file-item"
                      >
                        <img
                          src={getFileIcon(file.fileName)}
                          alt="File icon"
                          className="file-icon"
                        />
                        <div className="file-info">
                          <p className="file-name">{file.fileName}</p>
                          <p className="file-time-difference">
                            {getTimeDifference(file.timestamp)}
                          </p>
                        </div>
                      </a>
                      <div className="file-actions">
                        <button
                          className="file-action-btn"
                          title="Tải xuống"
                          onClick={(e) => {
                            e.preventDefault();
                            window.open(file.url, '_blank');
                          }}
                        >
                          <FaDownload size={18} />
                        </button>
                        <button
                          className="file-action-btn"
                          title="Chia sẻ"
                          onClick={(e) => {
                            e.preventDefault();
                            handleShareFile(file);
                          }}
                        >
                          <FaShare size={18} />
                        </button>
                        <button
                          className="file-action-btn"
                          title="Thêm"
                          onClick={(e) => handleContextMenu(e, file)}
                        >
                          <FaEllipsisH size={18} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                {files.length > 3 && (
                  <button className="view-all-btn" onClick={handleViewAllFiles}>
                    Xem tất cả ({files.length})
                  </button>
                )}
              </>
            ) : (
              <p>Chưa có file được chia sẻ.</p>
            )}
          </div>
        )}
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <div
          className="context-menu"
          ref={contextMenuRef}
          style={{
            top: contextMenu.y,
            left: contextMenu.x,
            position: 'fixed',
            zIndex: 1000,
          }}
        >
          <div
            className="context-menu-item"
            onClick={() => handleContextMenuAction('copyLink', contextMenu.file)}
          >
            Sao chép liên kết
          </div>
          <div className="context-menu-item context-menu-item-danger"
            onClick={() => handleContextMenuAction('delete', contextMenu.file)}
          >
            Xóa file
          </div>
        </div>
      )}

      {/* Section: Link */}
      <div className="info-section">
        <h4 onClick={() => toggleSection('links')} className="section-title">
          Link {expandedSections.links ? <BiSolidDownArrow size={13} color='#5a6981'/> : <BiSolidRightArrow size={13} color='#5a6981'/>}
        </h4>
        {expandedSections.links && (
          <div className="section-content">
            <p>Sẽ triển khai sau.</p>
          </div>
        )}
      </div>

      {/* Section: Thiết lập bảo mật */}
      <div className="info-section">
        <h4 onClick={() => toggleSection('security')} className="section-title">
          Thiết lập bảo mật {expandedSections.security ? <BiSolidDownArrow size={13} color='#5a6981'/> : <BiSolidRightArrow size={13} color='#5a6981'/>}
        </h4>
        {expandedSections.security && (
          <div className="section-content">
            <div className="security-item" onClick={handleAutoDeleteMessages}>
              <LiaStopwatchSolid  size={24} className="security-item-icon" />
              <div className="security-item-info">
                <p className="security-item-title">Tin nhắn tự xóa</p>
                <p className="security-item-subtitle">Không bao giờ</p>
              </div>
            </div>
            <div className="security-item">
              <div className="security-item-info">
                <p className="security-item-title">Ẩn trò chuyện</p>
              </div>
              <button className="security-toggle-btn" onClick={handleToggleHideChat}>
                {isHidden ? <MdToggleOn size={24} className="toggle-on" /> : <MdToggleOff size={24} className="toggle-off" />}
              </button>
            </div>
            <div className="security-item" >
              <IoWarningOutline  size={24} className="security-item-icon" />
              <div className="security-item-info">
                <p className="security-item-title">Báo xấu</p>
                <p className="security-item-subtitle">Báo cáo nội dung không phù hợp</p>
              </div>
            </div>
            <div className="security-item" >
              <VscTrash  size={24} className="security-item-icon danger-text" />
              <div className="security-item-info">
                <p className="security-item-subtitle">Xóa lịch sử trò chuyện</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default IndividualConversationInfo;