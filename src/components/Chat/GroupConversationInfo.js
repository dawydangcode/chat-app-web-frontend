import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../../assets/styles/ConversationInfo.css';
import { FaUsers, FaImages, FaFileAlt, FaLink, FaLock, FaClipboard } from 'react-icons/fa';
import { BiSolidRightArrow, BiSolidDownArrow } from "react-icons/bi";
import { RiGroupLine } from "react-icons/ri";

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
        console.log('Members fetched:', response.data.data.members); // Debug log
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
            fileName: msg.fileName,
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
      console.log('Current User ID:', currentUserId); // Debug log
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

  if (isMembersPage) {
    const isAdmin = members.find(member => member.userId === currentUserId && member.role === 'admin');
    console.log('Is Admin:', isAdmin); // Debug log
  
    return (
      <div className="members-page">
        <div className="members-header">
          <button className="back-btn" onClick={() => setIsMembersPage(false)}>
            ← Thông tin nhóm
          </button>
        </div>
        <div className="members-section">
          <p>Danh sách thành viên ({members.length})</p>
          <button className="add-member-btn-info" onClick={handleAddMember}>
            Thêm thành viên
          </button>
          <div className="members-list">
            {members.length > 0 ? (
              members.map((member) => {
                console.log('Member:', member); // Debug log
                return (
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
                      {/* Chỉ hiển thị nút nếu người dùng hiện tại là admin và thành viên không phải admin */}
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
                );
              })
            ) : (
              <p>Không có thành viên nào.</p>
            )}
          </div>
        </div>
  
        {/* Phần modal không thay đổi, giữ nguyên */}
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
          <button className="edit-group-name-btn" onClick={() => setIsEditGroupNameModalOpen(true)}>
            ✏️
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
            {files.length > 0 ? (
              <div className="file-list">
                {files.map((file, index) => (
                  <div key={index} className="file-item">
                    <a href={file.url} target="_blank" rel="noopener noreferrer">
                      {file.fileName}
                    </a>
                  </div>
                ))}
              </div>
            ) : (
              <p>Chưa có File được chia sẻ</p>
            )}
          </div>
        )}
      </div>

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
            <p>Sẽ triển khai sau</p>
          </div>
        )}
      </div>

      <div className="info-section">
        <h4 className="danger-text" onClick={() => setIsDeleteChatModalOpen(true)}>
          Xóa lịch sử trò chuyện
        </h4>
      </div>

      <div className="info-section">
        <h4 className="danger-text" onClick={() => setIsLeaveGroupModalOpen(true)}>
          Rời nhóm
        </h4>
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