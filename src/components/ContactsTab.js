import React, { useState } from 'react';
import '../assets/styles/Sidebar.css';

const ContactsTab = ({ setActiveSection, friendRequestsCount }) => {
  const [activeSection, setActiveSectionState] = useState('friendRequests');

  const handleSectionChange = (section) => {
    setActiveSectionState(section);
    setActiveSection(section);
  };

  return (
    <div className="contacts">
      <div className="contacts-header">
        <button
          className={`contact-tab-btn ${activeSection === 'friends' ? 'active' : ''}`}
          onClick={() => handleSectionChange('friends')}
        >
          Danh sách bạn bè
        </button>
        <button
          className={`contact-tab-btn ${activeSection === 'groups' ? 'active' : ''}`}
          onClick={() => handleSectionChange('groups')}
        >
          Danh sách nhóm
        </button>
        <button
          className={`contact-tab-btn ${activeSection === 'friendRequests' ? 'active' : ''}`}
          onClick={() => handleSectionChange('friendRequests')}
        >
          Lời mời kết bạn
        </button>
      </div>
    </div>
  );
};

export default ContactsTab;