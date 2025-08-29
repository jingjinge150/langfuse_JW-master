// src/components/SidePanel/SidePanel.jsx
import React from 'react';
import ReactDOM from 'react-dom';
import { X } from 'lucide-react';
import styles from './SidePanel.module.css';

const SidePanel = ({ title, isOpen, onClose, children }) => {
  if (!isOpen) {
    return null;
  }

  const handleOverlayClick = (e) => {
    // 클릭 대상이 배경(overlay) 자체일 때만 닫기
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return ReactDOM.createPortal(
    // 👇 onClick 핸들러 수정 및 data-is-portal 속성 추가
    <div className={styles.overlay} onClick={handleOverlayClick} data-is-portal="true">
      <div className={styles.panel}>
        <div className={styles.header}>
          <h3 className={styles.title}>{title}</h3>
          <button onClick={onClose} className={styles.closeButton}>
            <X size={20} />
          </button>
        </div>
        <div className={styles.body}>
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
};

export default SidePanel;