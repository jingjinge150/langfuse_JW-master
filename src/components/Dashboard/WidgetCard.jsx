import React from "react";
import PropTypes from "prop-types";
import styles from "./WidgetCard.module.css";
import { GripVertical, Copy, Trash2, Download } from "lucide-react";

function WidgetCard({ title, subtitle, children, onDelete, onCopy, onDownload }) {
  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <div>
          <h3 className={styles.title}>{title}</h3>
          {subtitle ? <p className={styles.subtitle}>{subtitle}</p> : null}
        </div>

        <div className={styles.cardActions}>
          <button
            type="button"
            className={`${styles.iconButton} drag-handle`}
            aria-label="Move widget"
            title="Move"
          >
            <GripVertical size={16} />
          </button>

          <button
            type="button"
            className={styles.iconButton}
            aria-label="Copy widget"
            title="Copy"
            onClick={onCopy}
          >
            <Copy size={16} />
          </button>

          <button
            type="button"
            className={styles.iconButton}
            aria-label="Delete widget"
            title="Delete"
            onClick={onDelete}
          >
            <Trash2 size={16} />
          </button>

          <button
            type="button"
            className={styles.iconButton}
            aria-label="Download widget data"
            title="Download"
            onClick={onDownload}
          >
            <Download size={16} />
          </button>
        </div>
      </div>

      <div className={styles.content}>{children}</div>

      {/* 리사이즈 핸들 (react-grid-layout 등과 연동 시 사용) */}
      <div className={styles.resizeHandle} />
    </div>
  );
}

WidgetCard.propTypes = {
  title: PropTypes.string.isRequired,
  subtitle: PropTypes.string,
  children: PropTypes.node,
  onDelete: PropTypes.func,
  onCopy: PropTypes.func,
  onDownload: PropTypes.func,
};

WidgetCard.defaultProps = {
  subtitle: "",
  children: null,
  onDelete: undefined,
  onCopy: undefined,
  onDownload: undefined,
};

export default WidgetCard;
