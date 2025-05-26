import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import '../../assets/styles/ConversationInfo.css';
import { FaUsers, FaImages, FaFileAlt, FaLink, FaLock, FaDownload, FaShare, FaEllipsisH, FaBellSlash, FaUsersCog, FaPen } from 'react-icons/fa';
import { LuPin, LuPinOff } from 'react-icons/lu';
import { BiSolidRightArrow, BiSolidDownArrow } from "react-icons/bi";
import { RiGroupLine } from "react-icons/ri";
import { LiaStopwatchSolid } from "react-icons/lia";
import { MdToggleOff, MdToggleOn } from "react-icons/md";
import { IoWarningOutline, IoSettingsOutline  } from "react-icons/io5";
import { VscTrash } from "react-icons/vsc";
import { RxExit } from "react-icons/rx";
import { AiOutlineUsergroupAdd } from "react-icons/ai";


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

const GroupConversationInfo = ({ chat }) => {
  const [isEditGroupNameModalOpen, setIsEditGroupNameModalOpen] = useState(false);
  const [isGroupInfoModalOpen, setIsGroupInfoModalOpen] = useState(false);
  const [isDeleteChatModalOpen, setIsDeleteChatModalOpen] = useState(false);
  const [isLeaveGroupModalOpen, setIsLeaveGroupModalOpen] = useState(false);
  const [isKickMemberModalOpen, setIsKickMemberModalOpen] = useState(false);
  const [isAssignRoleModalOpen, setIsAssignRoleModalOpen] = useState(false);
  const [groupName, setGroupName] = useState(chat?.name || 'Không có tên');
  const [mediaFiles, setMediaFiles] = useState([]);
  const [files, setFiles] = useState([]);
  const [members, setMembers] = useState([]);
  const [isMembersPage, setIsMembersPage] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [selectedRole, setSelectedRole] = useState('member');
  const [expandedSections, setExpandedSections] = useState({
    members: true,
    media: true,
    files: true,
    links: true,
    security: true,
    board: true,
  });
  const [contextMenu, setContextMenu] = useState(null);
  const [isHidden, setIsHidden] = useState(false); // Trạng thái ẩn trò chuyện
  const [isMuted, setIsMuted] = useState(false); // Trạng thái tắt thông báo
  const contextMenuRef = useRef(null);

  const token = localStorage.getItem('token');
  const currentUserId = localStorage.getItem('userId');

  const toggleSection = (section) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const fetchGroupMembers = async () => {
    if (!chat?.isGroup) return;
    try {
      const response = await axios.get(`http://localhost:3000/api/groups/members/${chat.id}`, {
        headers: { Authorization: `Bearer ${token.trim()}` },
      });
      if (response.data.success) {
        setMembers(response.data.data.members || []);
      } else {
        console.error('Failed to fetch members:', response.data.error);
      }
    } catch (error) {
      console.error('Error fetching group members:', error.message);
      setMembers([]);
    }
  };

  const fetchGroupMessages = async () => {
    if (!chat?.isGroup) return;
    try {
      const response = await axios.get(`http://localhost:3000/api/groups/messages/${chat.id}`, {
        headers: { Authorization: `Bearer ${token.trim()}` },
      });
      if (response.data.success) {
        const messages = response.data.data.messages || [];
        messages.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        const media = messages
          .filter((msg) => ['image', 'video'].includes(msg.type))
          .map((msg) => ({
            type: msg.type,
            url: msg.mediaUrl,
            fileName: msg.fileName,
            timestamp: msg.timestamp,
          }));

        const otherFiles = messages
          .filter((msg) => ['pdf', 'zip', 'file'].includes(msg.type))
          .map((msg) => ({
            type: msg.type,
            url: msg.mediaUrl,
            fileName: msg.fileName || `file_${msg.messageId}`,
            timestamp: msg.timestamp,
          }));

        setMediaFiles(media);
        setFiles(otherFiles);
      }
    } catch (error) {
      console.error('Error fetching group messages:', error);
      setMediaFiles([]);
      setFiles([]);
    }
  };

  useEffect(() => {
    if (chat?.isGroup) {
      fetchGroupMembers();
      fetchGroupMessages();
    }
  }, [chat]);

  const handleEditGroupName = async () => {
    try {
      const response = await axios.put(
        `http://localhost:3000/api/groups/info/${chat.id}`,
        { name: groupName },
        { headers: { Authorization: `Bearer ${token.trim()}` } }
      );
      if (response.data.success) {
        alert('Cập nhật tên nhóm thành công!');
        setIsEditGroupNameModalOpen(false);
      }
    } catch (error) {
      alert('Lỗi khi cập nhật tên nhóm: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleDeleteChatHistory = async () => {
    try {
      const response = await axios.delete(`http://localhost:3000/api/groups/messages/${chat.id}`, {
        headers: { Authorization: `Bearer ${token.trim()}` },
      });
      if (response.data.success) {
        alert('Đã xóa lịch sử trò chuyện!');
        setIsDeleteChatModalOpen(false);
      }
    } catch (error) {
      alert('Lỗi khi xóa lịch sử trò chuyện: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleLeaveGroup = async () => {
    try {
      const response = await axios.delete(`http://localhost:3000/api/groups/leave/${chat.id}`, {
        headers: { Authorization: `Bearer ${token.trim()}` },
      });
      if (response.data.success) {
        alert('Đã rời nhóm!');
        setIsLeaveGroupModalOpen(false);
        window.location.reload();
      }
    } catch (error) {
      alert('Lỗi khi rời nhóm: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleKickMember = async () => {
    try {
      const response = await axios.delete(
        `http://localhost:3000/api/groups/members/${chat.id}/${selectedMember.userId}`,
        { headers: { Authorization: `Bearer ${token.trim()}` } }
      );
      if (response.data.success) {
        alert('Đã đá thành viên khỏi nhóm!');
        setIsKickMemberModalOpen(false);
        fetchGroupMembers();
      }
    } catch (error) {
      alert('Lỗi khi đá thành viên: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleAssignRole = async () => {
    try {
      const response = await axios.post(
        `http://localhost:3000/api/groups/assignRole`,
        { groupId: chat.id, userId: selectedMember.userId, role: selectedRole },
        { headers: { Authorization: `Bearer ${token.trim()}` } }
      );
      if (response.data.success) {
        alert('Cập nhật vai trò thành công!');
        setIsAssignRoleModalOpen(false);
        fetchGroupMembers();
      }
    } catch (error) {
      alert('Lỗi khi cập nhật vai trò: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleShowMembers = () => {
    setIsMembersPage(true);
  };

  const handleAddMember = () => {
    alert('Chức năng thêm thành viên sẽ được triển khai sau!');
  };

  const handleViewAllMedia = () => {
    alert('Chức năng xem tất cả sẽ được triển khai sau!');
  };

  const handleViewAllFiles = () => {
    alert('Chức năng xem tất cả file sẽ được triển khai sau!');
  };

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

  const handleToggleHideChat = () => {
    setIsHidden(!isHidden);
    alert(`${isHidden ? 'Hiện' : 'Ẩn'} trò chuyện (Chức năng sẽ được triển khai sau!)`);
  };

  const handleAutoDeleteMessages = () => {
    alert('Chức năng tin nhắn tự xóa sẽ được triển khai sau!');
  };

  const handleReportChat = () => {
    alert('Chức năng báo xấu sẽ được triển khai sau!');
  };

  const handleMuteNotifications = () => {
    setIsMuted(!isMuted);
    alert(`${isMuted ? 'Bật' : 'Tắt'} thông báo (Chức năng sẽ được triển khai sau!)`);
  };

  const handlePinConversation = () => {
    if (chat.isPinned) {
      chat.onUnpinConversation();
    } else {
      chat.onPinConversation();
    }
  };

  const handleAddMemberIntoGroupChat = () => {
    alert('Thêm thành viên vào nhóm trò chuyện (Chức năng sẽ được triển khai sau!)');
  };

  const handleManageGroup = () => {
    alert('Quản lý nhóm (Chức năng sẽ được triển khai sau!)');
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

  if (isMembersPage) {
    const isAdmin = members.find(member => member.userId === currentUserId && member.role === 'admin');
    return (
      <div className="members-page">
        <div className="members-header">
          <button className="back-btn" onClick={() => setIsMembersPage(false)}>
            ← Thành viên
          </button>
        </div>
        <div className="members-section">
          <button className="add-member-btn-info" onClick={handleAddMember}>
            Thêm thành viên
          </button>
                    <p style={{fontWeight:500, color: 'black'}}>Danh sách thành viên ({members.length})</p>
          <div className="members-list">
            {members.length > 0 ? (
              members.map((member) => (
                <div key={member.userId} className="member-item">
                  <img
                    src={member.avatar || 'https://placehold.co/40x40'}
                    alt="Avatar"
                    className="member-avatar"
                  />
                  <div className="member-info">
                    <div className="member-details">
                      <p>{member.userId === currentUserId ? 'Bạn' : member.name || 'Không có tên'}</p>
                      {member.role === 'admin' && <span className="admin-label">Trưởng nhóm</span>}
                    </div>
                    {isAdmin && member.userId !== currentUserId && member.role !== 'admin' && (
                      <div className="member-actions">
                        <button
                          className="kick-btn"
                          onClick={() => {
                            setSelectedMember(member);
                            setIsKickMemberModalOpen(true);
                          }}
                        >
                          Đá khỏi nhóm
                        </button>
                        <button
                          className="assign-role-btn"
                          onClick={() => {
                            setSelectedMember(member);
                            setIsAssignRoleModalOpen(true);
                          }}
                        >
                          Gán vai trò
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <p>Không có thành viên nào.</p>
            )}
          </div>
        </div>

        {isKickMemberModalOpen && (
          <div className="modal-overlay">
            <div className="kick-member-modal">
              <div className="modal-header">
                <h3>Đá thành viên</h3>
                <button className="modal-close-btn" onClick={() => setIsKickMemberModalOpen(false)}>
                  ×
                </button>
              </div>
              <div className="modal-body">
                <p>Bạn có chắc chắn muốn đá {selectedMember?.name || 'thành viên'} khỏi nhóm?</p>
                <div className="modal-actions">
                  <button className="modal-cancel-btn" onClick={() => setIsKickMemberModalOpen(false)}>
                    Hủy
                  </button>
                  <button className="modal-confirm-btn danger-btn" onClick={handleKickMember}>
                    Xác nhận
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {isAssignRoleModalOpen && (
          <div className="modal-overlay">
            <div className="assign-role-modal">
              <div className="modal-header">
                <h3>Gán vai trò cho {selectedMember?.name || 'thành viên'}</h3>
                <button className="modal-close-btn" onClick={() => setIsAssignRoleModalOpen(false)}>
                  ×
                </button>
              </div>
              <div className="modal-body">
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  className="role-select"
                >
                  <option value="member">Thành viên</option>
                  <option value="co-admin">Phó nhóm</option>
                  <option value="admin">Trưởng nhóm</option>
                </select>
                <div className="modal-actions">
                  <button className="modal-cancel-btn" onClick={() => setIsAssignRoleModalOpen(false)}>
                    Hủy
                  </button>
                  <button className="modal-confirm-btn" onClick={handleAssignRole}>
                    Xác nhận
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  const recentMediaFiles = mediaFiles.slice(0, 6);
  const recentFiles = files.slice(0, 3);

  return (
    <div className="conversation-info">
      <div className="chat-info-header">
        <h4>Thông tin nhóm</h4>
      </div>
      <div className="info-header">
        <img
          src={chat?.avatar || '/assets/images/placeholder.png'}
          alt="Group Avatar"
          className="info-avatar"
          onClick={() => setIsGroupInfoModalOpen(true)}
        />
        <div className="group-name-container">
          <h3>{groupName}</h3>
          <button className="edit-nickname-btn" onClick={() => setIsEditGroupNameModalOpen(true)} title="Đổi tên nhóm">
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
          <button className="header-action-btn" onClick={handleAddMemberIntoGroupChat} title="Thêm thành viên">
            <AiOutlineUsergroupAdd size={18} />
          </button>
          <button className="header-action-btn" onClick={handleManageGroup} title="Quản lý nhóm">
            <IoSettingsOutline  size={18} />
          </button>
        </div>
      </div>

      <div className="info-section">
        <h4 onClick={() => toggleSection('members')} className="section-title">
          Thành viên nhóm {expandedSections.members ? <BiSolidDownArrow size={13} color='#5a6981'/> : <BiSolidRightArrow size={13} color='#5a6981'/>}
        </h4>
        {expandedSections.members && (
          <div className="section-content">
            <div onClick={handleShowMembers} className="clickable">
              <RiGroupLine size={21}/> {members.length} thành viên
            </div>
          </div>
        )}
      </div>

      <div className="info-section">
        <h4 onClick={() => toggleSection('board')} className="section-title">
          Bảng tin nhóm {expandedSections.board ? <BiSolidDownArrow size={13} color='#5a6981'/> : <BiSolidRightArrow size={13} color='#5a6981'/>}
        </h4>
        {expandedSections.board && (
          <div className="section-content">
            <p>Sẽ triển khai sau</p>
          </div>
        )}
      </div>

      <div className="info-section">
        <h4 onClick={() => toggleSection('media')} className="section-title">
          Ảnh/Video {expandedSections.media ? <BiSolidDownArrow size={13} color='#5a6981'/> : <BiSolidRightArrow size={13} color='#5a6981'/>}
        </h4>
        {expandedSections.media && (
          <div className="section-content">
            {recentMediaFiles.length > 0 ? (
              <>
                <div className="media-grid">
                  {recentMediaFiles.map((media, index) => (
                    <div key={index} className="media-item">
                      {media.type === 'image' ? (
                        <img src={media.url} alt={media.fileName} />
                      ) : (
                        <video src={media.url} controls />
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
              <p>Chưa có Ảnh/Video được chia sẻ</p>
            )}
          </div>
        )}
      </div>

      <div className="info-section">
        <h4 onClick={() => toggleSection('files')} className="section-title">
          File {expandedSections.files ? <BiSolidDownArrow size={13} color='#5a6981'/> : <BiSolidRightArrow size={13} color='#5a6981'/>}
        </h4>
        {expandedSections.files && (
          <div className="section-content">
            {recentFiles.length > 0 ? (
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
          <div
            className="context-menu-item context-menu-item-danger"
            onClick={() => handleContextMenuAction('delete', contextMenu.file)}
          >
            Xóa file
          </div>
        </div>
      )}

      <div className="info-section">
        <h4 onClick={() => toggleSection('links')} className="section-title">
          Link {expandedSections.links ? <BiSolidDownArrow size={13} color='#5a6981'/> : <BiSolidRightArrow size={13} color='#5a6981'/>}
        </h4>
        {expandedSections.links && (
          <div className="section-content">
            <p>Sẽ triển khai sau</p>
          </div>
        )}
      </div>

      <div className="info-section">
        <h4 onClick={() => toggleSection('security')} className="section-title">
          Thiết lập bảo mật {expandedSections.security ? <BiSolidDownArrow size={13} color='#5a6981'/> : <BiSolidRightArrow size={13} color='#5a6981'/>}
        </h4>
        {expandedSections.security && (
          <div className="section-content">
            <div className="security-item" onClick={handleAutoDeleteMessages}>
              <LiaStopwatchSolid size={24} className="security-item-icon" />
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
            <div className="security-item" onClick={handleReportChat}>
              <IoWarningOutline size={24} className="security-item-icon" />
              <div className="security-item-info">
                <p className="security-item-subtitle" style={{fontWeight:500 }}>Báo xấu</p>
              </div>
            </div>
            <div className="security-item" onClick={() => setIsDeleteChatModalOpen(true)}>
              <VscTrash size={24} className="security-item-icon danger-text" />
              <div className="security-item-info">
                <p className="security-item-subtitle" style={{ color: '#c31818', fontWeight:500 }}>Xóa lịch sử trò chuyện</p>
              </div>
            </div>
            <div className="security-item" onClick={() => setIsLeaveGroupModalOpen(true)}>
              <RxExit size={24} className="security-item-icon danger-text" />
              <div className="security-item-info">
                <p className="security-item-subtitle" style={{ color: '#c31818', fontWeight:500 }}>Rời nhóm</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {isEditGroupNameModalOpen && (
        <div className="modal-overlay">
          <div className="edit-group-name-modal">
            <div className="modal-header">
              <h3>Đổi tên nhóm</h3>
              <button className="modal-close-btn" onClick={() => setIsEditGroupNameModalOpen(false)}>
                ×
              </button>
            </div>
            <div className="modal-body">
              <input
                type="text"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder="Nhập tên nhóm mới"
              />
              <div className="modal-actions">
                <button className="modal-cancel-btn" onClick={() => setIsEditGroupNameModalOpen(false)}>
                  Hủy
                </button>
                <button className="modal-confirm-btn" onClick={handleEditGroupName}>
                  Xác nhận
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {isGroupInfoModalOpen && (
        <div className="modal-overlay">
          <div className="group-info-modal">
            <div className="modal-header">
              <h3>Thông tin nhóm</h3>
              <button className="modal-close-btn" onClick={() => setIsGroupInfoModalOpen(false)}>
                ×
              </button>
            </div>
            <div className="modal-body">
              <input
                type="text"
                value={`KTVTKPM(N4-khoa) + CNM(Nhóm 2)`}
                readOnly
                className="group-name-input"
              />
              <div className="modal-actions">
                <button className="modal-cancel-btn" onClick={() => setIsGroupInfoModalOpen(false)}>
                  Hủy
                </button>
                <button className="modal-confirm-btn">Xác nhận</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {isDeleteChatModalOpen && (
        <div className="modal-overlay">
          <div className="delete-chat-modal">
            <div className="modal-header">
              <h3>Xóa lịch sử trò chuyện</h3>
              <button className="modal-close-btn" onClick={() => setIsDeleteChatModalOpen(false)}>
                ×
              </button>
            </div>
            <div className="modal-body">
              <p>Toàn bộ nội dung trò chuyện sẽ bị xóa vĩnh viễn. Bạn có chắc chắn muốn xóa?</p>
              <div className="modal-actions">
                <button className="modal-cancel-btn" onClick={() => setIsDeleteChatModalOpen(false)}>
                  Hủy
                </button>
                <button className="modal-confirm-btn danger-btn" onClick={handleDeleteChatHistory}>
                  Xác nhận
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {isLeaveGroupModalOpen && (
        <div className="modal-overlay">
          <div className="leave-group-modal">
            <div className="modal-header">
              <h3>Rời nhóm và xóa trò chuyện</h3>
              <button className="modal-close-btn" onClick={() => setIsLeaveGroupModalOpen(false)}>
                ×
              </button>
            </div>
            <div className="modal-body">
              <p>Bạn sẽ không thể xem lại tin nhắn trong nhóm này sau khi rời nhóm.</p>
              <div className="modal-actions">
                <button className="modal-cancel-btn" onClick={() => setIsLeaveGroupModalOpen(false)}>
                  Hủy
                </button>
                <button className="modal-confirm-btn danger-btn" onClick={handleLeaveGroup}>
                  Xác nhận
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GroupConversationInfo;