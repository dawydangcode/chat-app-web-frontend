import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../../assets/styles/ConversationInfo.css';
import { FaImages, FaFileAlt, FaLink, FaLock } from 'react-icons/fa';
import { BiSolidRightArrow, BiSolidDownArrow } from "react-icons/bi";

const IndividualConversationInfo = ({ chat }) => {
  const [mediaFiles, setMediaFiles] = useState([]);
  const [files, setFiles] = useState([]);
  const [expandedSections, setExpandedSections] = useState({
    media: true,
    files: true,
    links: true,
    security: true,
  });

  const token = localStorage.getItem('token');

  const toggleSection = (section) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const fetchMessages = async () => {
    if (!chat?.targetUserId) return;
    try {
      const response = await axios.get(
        `http://localhost:3000/api/messages/user/${chat.targetUserId}`,
        {
          headers: { Authorization: `Bearer ${token.trim()}` },
        }
      );
      if (response.data.success) {
        const messages = response.data.messages || [];
        // Sắp xếp messages theo thời gian (mới nhất trước)
        messages.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        // Lấy media files
        const media = messages
          .filter((msg) => ['image', 'video'].includes(msg.type))
          .map((msg) => ({
            type: msg.type,
            url: msg.mediaUrl,
            fileName: msg.fileName,
            timestamp: msg.timestamp, // Thêm timestamp để sắp xếp
          }));

        // Lấy files khác
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
      console.error('Error fetching messages:', error);
      setMediaFiles([]);
      setFiles([]);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, [chat]);

  const handleViewAllMedia = () => {
    alert('Chức năng xem tất cả sẽ được triển khai sau!');
  };

  // Lấy 6 media mới nhất
  const recentMediaFiles = mediaFiles.slice(0, 6);

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
          <h3>{chat?.name || 'Không có tên'}</h3>
        </div>
      </div>

      {/* Section: Ảnh/Video */}
      <div className="info-section">
        <h4 onClick={() => toggleSection('media')} className="section-title">
          Ảnh/Video {expandedSections.media ? <BiSolidDownArrow size={13} color='#5a6981'/>  :   <BiSolidRightArrow size={13} color='#5a6981'/>       }
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

      {/* Section: File */}
      <div className="info-section">
        <h4 onClick={() => toggleSection('files')} className="section-title">
          File {expandedSections.files ? <BiSolidDownArrow size={13} color='#5a6981'/>  :   <BiSolidRightArrow size={13} color='#5a6981'/> }
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

      {/* Section: Link */}
      <div className="info-section">
        <h4 onClick={() => toggleSection('links')} className="section-title">
          Link {expandedSections.links ? <BiSolidDownArrow size={13} color='#5a6981'/>  :   <BiSolidRightArrow size={13} color='#5a6981'/> }
        </h4>
        {expandedSections.links && (
          <div className="section-content">
            <p>Sẽ triển khai sau</p>
          </div>
        )}
      </div>

      {/* Section: Thiết lập bảo mật */}
      <div className="info-section">
        <h4 onClick={() => toggleSection('security')} className="section-title">
          Thiết lập bảo mật {expandedSections.security ? <BiSolidDownArrow size={13} color='#5a6981'/>  :   <BiSolidRightArrow size={13} color='#5a6981'/> }
        </h4>
        {expandedSections.security && (
          <div className="section-content">
            <p>Sẽ triển khai sau</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default IndividualConversationInfo;