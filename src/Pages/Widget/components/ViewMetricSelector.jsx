// src/Pages/Widget/components/ViewMetricSelector.jsx
import React from "react";
import styles from "./ViewMetricSelector.module.css";

const ViewMetricSelector = ({
  view,
  onChangeView,
  measure,
  onChangeMeasure,
  aggregation,
  onChangeAggregation,
  disabled = false,
}) => {
  const measureOptions = [
    { value: "count", label: "Count" },
    { value: "latency", label: "Latency" },
    { value: "total_tokens", label: "Total Tokens" },
    { value: "totalCost", label: "Total Cost" },
    { value: "duration", label: "Duration" },
    { value: "input_tokens", label: "Input Tokens" },
    { value: "output_tokens", label: "Output Tokens" },
  ];

  const aggregationOptions = [
    { value: "count", label: "Count" },
    { value: "sum", label: "Sum" },
    { value: "avg", label: "Average" },
    { value: "min", label: "Minimum" },
    { value: "max", label: "Maximum" },
    { value: "histogram", label: "Histogram" },
  ];

  return (
    <div className={styles.container}>
      {/* View Selection */}
      <div className={styles.block}>
        <label className={styles.label}>View</label>
        <select
          className={styles.select}
          value={view}
          onChange={(e) => onChangeView(e.target.value)}
        >
          <option value="traces">Traces</option>
          <option value="observations">Observations</option>
          <option value="scores">Scores</option>
        </select>
      </div>

      {/* Metric Selection */}
      <div className={styles.block}>
        <label className={styles.label}>Metric</label>
        <div className={styles.grid2}>
          <select
            className={styles.select}
            value={measure}
            onChange={(e) => onChangeMeasure(e.target.value)}
          >
            {measureOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          {/* Aggregation - only show when measure is not 'count' */}
          {measure !== "count" && (
            <select
              className={styles.select}
              value={aggregation}
              onChange={(e) => onChangeAggregation(e.target.value)}
              disabled={disabled}
              title={
                disabled
                  ? "Aggregation is set automatically for this chart type"
                  : ""
              }
            >
              {aggregationOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          )}
        </div>

        {disabled && (
          <p className={styles.helpText}>
            Aggregation is automatically set for this chart type
          </p>
        )}
      </div>
    </div>
  );
};

export default ViewMetricSelector;
