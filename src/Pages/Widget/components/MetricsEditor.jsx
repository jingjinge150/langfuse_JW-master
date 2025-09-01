// src/Pages/Widget/components/MetricsEditor.jsx
import React from "react";
import styles from "../NewWidget.module.css";

const MEASURE_OPTIONS_BY_VIEW = {
  traces: [
    { value: "count", label: "Count" },
    { value: "latency", label: "Latency" },
    { value: "totalCost", label: "Total Cost" },
    { value: "totalTokens", label: "Total Tokens" },
    { value: "duration", label: "Duration" },
    { value: "cost", label: "Cost" },
    { value: "input_tokens", label: "Input Tokens" },
    { value: "output_tokens", label: "Output Tokens" },
  ],
  observations: [
    { value: "count", label: "Count" },
    { value: "latency", label: "Latency" },
    { value: "duration", label: "Duration" },
    { value: "cost", label: "Cost" },
  ],
  scores: [
    { value: "count", label: "Count" },
    { value: "score", label: "Score" },
  ],
};

const AGGREGATION_OPTIONS = [
  { value: "count", label: "Count" },
  { value: "sum", label: "Sum" },
  { value: "avg", label: "Average" },
  { value: "min", label: "Min" },
  { value: "max", label: "Max" },
  { value: "p50", label: "P50" },
  { value: "p90", label: "P90" },
  { value: "p95", label: "P95" },
  { value: "p99", label: "P99" },
];

export default function MetricsEditor({ metrics, setMetrics, view }) {
  const measures = MEASURE_OPTIONS_BY_VIEW[view] || MEASURE_OPTIONS_BY_VIEW.traces;

  const updateMetric = (idx, patch) => {
    const next = [...metrics];
    next[idx] = { ...next[idx], ...patch };
    setMetrics(next);
  };

  const addMetric = () =>
    setMetrics([...metrics, { measure: "count", aggregation: "count" }]);

  const removeMetric = (idx) => {
    const next = metrics.filter((_, i) => i !== idx);
    setMetrics(next.length ? next : [{ measure: "count", aggregation: "count" }]);
  };

  return (
    <div className={styles.block}>
      <label className={styles.label}>Metrics</label>
      <div className={styles.card} style={{ gap: 8 }}>
        {metrics.map((m, idx) => (
          <div key={idx} className={styles.row} style={{ gap: 8, alignItems: "center" }}>
            <select
              className={styles.select}
              value={m.measure}
              onChange={(e) => updateMetric(idx, { measure: e.target.value })}
            >
              {measures.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>

            <select
              className={styles.select}
              value={m.aggregation}
              onChange={(e) => updateMetric(idx, { aggregation: e.target.value })}
            >
              {AGGREGATION_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>

            <button
              type="button"
              className={styles.secondaryBtn}
              onClick={() => removeMetric(idx)}
              title="Remove metric"
            >
              −
            </button>
          </div>
        ))}
        <div>
          <button type="button" className={styles.secondaryBtn} onClick={addMetric}>
            + Add metric
          </button>
        </div>
      </div>
    </div>
  );
}
