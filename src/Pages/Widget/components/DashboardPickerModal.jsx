// src/Pages/Widget/components/DashboardPickerModal.jsx
import React from "react";

export default function DashboardPickerModal({
  styles,
  open,
  dashboards,
  loading,
  onClose,
  onSkip,
  onPick,
}) {
  if (!open) return null;
  return (
    <div className={styles.modalBackdrop}>
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <h3>Select dashboard to add widget to</h3>
          <button
            className={styles.modalClose}
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>
        </div>
        <div className={styles.modalBody}>
          {loading ? (
            <div className={styles.loadingRow}>Loading…</div>
          ) : dashboards.length === 0 ? (
            <div className={styles.emptyRow}>No dashboards yet.</div>
          ) : (
            <div className={styles.dashboardList}>
              {dashboards.map((d) => (
                <button
                  key={d.id}
                  className={styles.dashboardRow}
                  onClick={() => onPick(d)}
                >
                  <div className={styles.dbName}>{d.name}</div>
                  <div className={styles.dbUpdated}>
                    {new Date(d.updatedAt).toLocaleString()}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
        <div className={styles.modalFooter}>
          <button className={styles.btnLight} onClick={onSkip}>
            Skip
          </button>
        </div>
      </div>
    </div>
  );
}
