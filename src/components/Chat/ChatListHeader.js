import React, { useState } from 'react';
import { FaSearch } from 'react-icons/fa';
import { GoPersonAdd } from 'react-icons/go';
import { AiOutlineUsergroupAdd } from 'react-icons/ai';
import CreateGroupModal from '../CreateGroupModal';
import '../../assets/styles/ChatPage.css';

const ChatListHeader = ({
  isSearchActive,
  setIsSearchActive,
  userSearchQuery,
  setUserSearchQuery,
  handleUserSearch,
  handleAddFriend,
  handleCreateGroup,
  handleCloseSearch,
  onGroupCreated, // Thêm prop để cập nhật danh sách nhóm
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="chat-list-header">
      <div className="search-container">
        <FaSearch className="search-icon" />
        <input
          type="text"
          placeholder="Tìm kiếm"
          value={userSearchQuery}
          onChange={(e) => handleUserSearch(e.target.value)}
          onFocus={() => setIsSearchActive(true)}
        />
      </div>
      {isSearchActive ? (
        <button className="action-btn close-btn" onClick={handleCloseSearch}>
          Đóng
        </button>
      ) : (
        <div className="header-actions">
          <button className="action-btn add-friend-btn" onClick={handleAddFriend} title="Thêm bạn">
            <GoPersonAdd />
          </button>
          <button
            className="action-btn create-group-btn"
            onClick={() => setIsModalOpen(true)} // Mở modal
            title="Tạo nhóm chat"
          >
            <AiOutlineUsergroupAdd />
          </button>
        </div>
      )}

      {/* Tích hợp modal */}
      <CreateGroupModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onGroupCreated={onGroupCreated} // Truyền hàm để cập nhật nhóm
      />
    </div>
  );
};

export default ChatListHeader;