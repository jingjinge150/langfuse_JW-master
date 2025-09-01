// src/Pages/Widget/components/PivotControls.jsx
import React, { useMemo } from "react";
import styles from "../NewWidget.module.css";

const DIMENSION_OPTIONS = [
  { value: "none", label: "None" },
  { value: "environment", label: "Environment" },
  { value: "traceName", label: "Trace Name" },
  { value: "release", label: "Release" },
  { value: "version", label: "Version" },
  { value: "user", label: "User" },
  { value: "session", label: "Session" },
  { value: "tags", label: "Tags" },
];

const metricLabel = ({ aggregation, measure }) =>
  `${aggregation || "count"}_${measure || "count"}`.toLowerCase();

export default function PivotControls({
  rowDim1,
  setRowDim1,
  rowDim2,
  setRowDim2,
  sortColumn,
  setSortColumn,
  sortOrder,
  setSortOrder,
  metrics,
  showSubtotals,
  setShowSubtotals,
}) {
  const metricOptions = useMemo(() => {
    const opts = metrics.map((m) => ({
      value: metricLabel(m),
      label: `${m.aggregation.toUpperCase()} ${m.measure}`,
    }));
    return [
      { value: "", label: "No default sort" },
      ...opts,
      { value: "rowTotal", label: "Row Total" },
    ];
  }, [metrics]);

  return (
    <>
      <div className={styles.block}>
        <label className={styles.label}>Row Dimensions</label>
        <div className={styles.row} style={{ gap: 8 }}>
          <select
            className={styles.select}
            value={rowDim1}
            onChange={(e) => {
              const v = e.target.value;
              setRowDim1(v);
              if (v === "none") setRowDim2("none");
            }}
          >
            {DIMENSION_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          <select
            className={styles.select}
            value={rowDim2}
            disabled={rowDim1 === "none"}
            onChange={(e) => setRowDim2(e.target.value)}
          >
            {DIMENSION_OPTIONS.map((opt) => (
              <option
                key={opt.value}
                value={opt.value}
                disabled={opt.value !== "none" && opt.value === rowDim1}
              >
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className={styles.block}>
        <label className={styles.label}>Default Sort Configuration</label>
        <div className={styles.row} style={{ gap: 8 }}>
          <select
            className={styles.select}
            value={sortColumn}
            onChange={(e) => setSortColumn(e.target.value)}
          >
            {metricOptions.map((opt) => (
              <option key={opt.value || "none"} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          <select
            className={styles.select}
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
          >
            <option value="desc">Descending (Z-A)</option>
            <option value="asc">Ascending (A-Z)</option>
          </select>
        </div>

        <div style={{ marginTop: 8 }}>
          <label className={styles.checkboxLabel}>
            <input
              type="checkbox"
              checked={showSubtotals}
              onChange={(e) => setShowSubtotals(e.target.checked)}
              style={{ marginRight: 8 }}
            />
            Show subtotals for first dimension
          </label>
        </div>
      </div>
    </>
  );
}
