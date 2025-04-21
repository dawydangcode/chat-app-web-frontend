import React from 'react';
import '../../assets/styles/Sidebar.css';

const UserSearch = ({ userSearchResults, recentSearches, handleSelectUser }) => {
  return (
    <div className="search-form">
      {userSearchResults.length > 0 && (
        <div className="user-search-results">
          <h4>Kết quả tìm kiếm</h4>
          {userSearchResults.map((user) => (
            <div key={user.userId} className="user-search-item" onClick={() => handleSelectUser(user)}>
              <img
                src={user.avatar || '/assets/images/avatar.png'}
                alt="Avatar"
                className="user-search-avatar"
              />
              <div className="user-search-info">
                <p className="user-search-name">{user.name}</p>
                <p className="user-search-phone">{user.phoneNumber}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {recentSearches.length > 0 && (
        <div className="recent-searches">
          <h4>Tìm kiếm gần đây</h4>
          {recentSearches.map((user) => (
            <div key={user.userId} className="user-search-item" onClick={() => handleSelectUser(user)}>
              <img
                src={user.avatar || '/assets/images/avatar.png'}
                alt="Avatar"
                className="user-search-avatar"
              />
              <div className="user-search-info">
                <p className="user-search-name">{user.name}</p>
                <p className="user-search-phone">{user.phoneNumber}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default UserSearch;