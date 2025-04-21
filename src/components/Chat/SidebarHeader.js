import React from 'react';
import '../../assets/styles/Sidebar.css';
// Import thư viện icon (ví dụ: Font Awesome)
import { FaComments, FaAddressBook, FaCog } from 'react-icons/fa';

const SidebarHeader = ({ userProfile, activeTab, setActiveTab }) => {
  return (
    <div className="sidebar-header">
      <img
        src={userProfile.avatar || '/assets/images/avatar.png'}
        alt="Avatar"
        className="avatar"
        onClick={() => setActiveTab('settings')}
      />
      <div className="sidebar-actions">
        <button
          className={activeTab === 'messages' ? 'active' : ''}
          onClick={() => setActiveTab('messages')}
        >
          <FaComments /> {/* Icon Tin nhắn */}
        </button>
        <button
          className={activeTab === 'contacts' ? 'active' : ''}
          onClick={() => setActiveTab('contacts')}
        >
          <FaAddressBook /> {/* Icon Danh bạ */}
        </button>
        <button
          className={activeTab === 'settings' ? 'active' : ''}
          onClick={() => setActiveTab('settings')}
        >
          <FaCog /> {/* Icon Cài đặt */}
        </button>
      </div>
    </div>
  );
};

export default SidebarHeader;