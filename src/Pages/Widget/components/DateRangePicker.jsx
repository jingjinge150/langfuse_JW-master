// src/Pages/Widget/components/DateRangePicker.jsx
import React, { useMemo, useState } from "react";
import styles from "../NewWidget.module.css";

const PRESETS = [
  { key: "7d", label: "Last 7 days", days: 7 },
  { key: "14d", label: "Last 14 days", days: 14 },
  { key: "30d", label: "Last 30 days", days: 30 },
];

function toDateInputValue(d) {
  const pad = (n) => String(n).padStart(2, "0");
  const dt = new Date(d ?? Date.now());
  const yyyy = dt.getFullYear();
  const mm = pad(dt.getMonth() + 1);
  const dd = pad(dt.getDate());
  const hh = pad(dt.getHours());
  const min = pad(dt.getMinutes());
  return `${yyyy}-${mm}-${dd}T${hh}:${min}`;
}

export default function DateRangePicker({ value, onChange }) {
  const { from, to, option } = value || {};
  const [openPresets, setOpenPresets] = useState(false);

  const fromInput = useMemo(
    () => toDateInputValue(from || new Date(Date.now() - 7 * 86400000)),
    [from]
  );
  const toInput = useMemo(() => toDateInputValue(to || new Date()), [to]);

  const applyPreset = (days, key) => {
    const end = new Date();
    const start = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    onChange?.({ from: start, to: end, option: key });
    setOpenPresets(false);
  };

  return (
    <div className={styles["config-section"]}>
      <div className={styles["section-header"]}>
        <h3>Date Range</h3>

        <div className={styles["preset-dropdown"]}>
          <button
            type="button"
            className={styles["preset-btn"]}
            onClick={() => setOpenPresets((v) => !v)}
          >
            Presets ▾
          </button>
          {openPresets && (
            <div className={styles["preset-menu"]}>
              {PRESETS.map((p) => (
                <div
                  key={p.key}
                  className={styles["preset-item"]}
                  onClick={() => applyPreset(p.days, p.key)}
                >
                  {p.label}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className={styles["date-range-container"]}>
        <div className={styles["form-group"]} style={{ margin: 0 }}>
          <label>From</label>
          <input
            className={styles["form-input"]}
            type="datetime-local"
            value={fromInput}
            onChange={(e) => {
              const d = new Date(e.target.value);
              onChange?.({ from: d, to: to || new Date(), option });
            }}
          />
        </div>

        <div className={styles["form-group"]} style={{ margin: 0 }}>
          <label>To</label>
          <input
            className={styles["form-input"]}
            type="datetime-local"
            value={toInput}
            onChange={(e) => {
              const d = new Date(e.target.value);
              onChange?.({
                from: from || new Date(Date.now() - 7 * 86400000),
                to: d,
                option,
              });
            }}
          />
        </div>
      </div>
    </div>
  );
}
