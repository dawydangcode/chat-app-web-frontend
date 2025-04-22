import React from 'react';
import { FaSearch } from 'react-icons/fa';
import { GoPersonAdd } from 'react-icons/go';
import { AiOutlineUsergroupAdd } from 'react-icons/ai';
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
}) => {
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
          <button className="action-btn create-group-btn" onClick={handleCreateGroup} title="Tạo nhóm chat">
            <AiOutlineUsergroupAdd />
          </button>
        </div>
      )}
    </div>
  );
};

export default ChatListHeader;