// src/components/AddToDatasetModal/AddToDatasetModal.jsx
import React from 'react';
import ReactDOM from 'react-dom';
import { X, ChevronDown } from 'lucide-react';
import styles from './AddToDatasetModal.module.css';
import CodeBlock from '../CodeBlock/CodeBlock';

const AddToDatasetModal = ({ isOpen, onClose, input, output, metadata }) => {
  if (!isOpen) {
    return null;
  }

  const handleSave = () => {
    console.log('Adding to dataset...');
    onClose();
  };

  const handleOverlayClick = (e) => {
    // 클릭된 요소가 오버레이 배경 자체일 때만 모달을 닫습니다.
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return ReactDOM.createPortal(
    // 👇 onClick 핸들러를 handleOverlayClick으로 변경합니다.
    <div className={styles.overlay} onClick={handleOverlayClick} data-is-portal="true">
      {/* 이제 내부 클릭 이벤트 전파를 막을 필요가 없습니다. */}
      <div className={styles.modal}>
        <div className={styles.header}>
          <h2 className={styles.title}>Add to datasets</h2>
          <button onClick={onClose} className={styles.closeButton}>
            <X size={20} />
          </button>
        </div>

        <div className={styles.body}>
          {/* ... (내용은 변경 없음) ... */}
          <div className={styles.formGroup}>
            <label htmlFor="datasets-select">Datasets</label>
            <div className={styles.selectWrapper}>
              <select id="datasets-select" className={styles.select}>
                <option>Select datasets</option>
              </select>
              <ChevronDown size={16} className={styles.selectArrow} />
            </div>
          </div>
          <div className={styles.ioGrid}>
            <div className={styles.ioColumn}>
              <label>Input</label>
              <CodeBlock code={input} />
            </div>
            <div className={styles.ioColumn}>
              <label>Expected output</label>
              <CodeBlock code={output} />
            </div>
          </div>
          <div className={styles.formGroup}>
            <label>Metadata</label>
            <CodeBlock code={metadata} />
          </div>
        </div>

        <div className={styles.footer}>
          <button onClick={handleSave} className={styles.saveButton}>
            Add to dataset
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default AddToDatasetModal;