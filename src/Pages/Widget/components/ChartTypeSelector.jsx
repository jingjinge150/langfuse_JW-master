// src/Pages/Widget/components/ChartTypeSelector.jsx
import React from "react";
import {
  BarChart,
  LineChart,
  PieChart,
  Hash,
  BarChart3,
  BarChartHorizontal,
} from "lucide-react";
import styles from "./ChartTypeSelector.module.css";

const ChartTypeSelector = ({ value, onChange }) => {
  const chartTypes = [
    {
      value: "LINE_TIME_SERIES",
      label: "Line Chart",
      icon: LineChart,
      group: "time-series",
    },
    {
      value: "BAR_TIME_SERIES",
      label: "Vertical Bar Chart",
      icon: BarChart,
      group: "time-series",
    },
    {
      value: "NUMBER",
      label: "Big Number",
      icon: Hash,
      group: "total-value",
    },
    {
      value: "HORIZONTAL_BAR",
      label: "Horizontal Bar Chart",
      icon: BarChartHorizontal,
      group: "total-value",
    },
    {
      value: "VERTICAL_BAR",
      label: "Vertical Bar Chart",
      icon: BarChart,
      group: "total-value",
    },
    {
      value: "PIE",
      label: "Pie Chart",
      icon: PieChart,
      group: "total-value",
    },
    {
      value: "HISTOGRAM",
      label: "Histogram",
      icon: BarChart3,
      group: "total-value",
    },
  ];

  const selectedChart = chartTypes.find((c) => c.value === value);
  const SelectedIcon = selectedChart?.icon || LineChart;

  return (
    <div className={styles.container}>
      <select
        className={styles.select}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        <optgroup label="Time Series">
          {chartTypes
            .filter((c) => c.group === "time-series")
            .map((chart) => (
              <option key={chart.value} value={chart.value}>
                {chart.label}
              </option>
            ))}
        </optgroup>
        <optgroup label="Total Value">
          {chartTypes
            .filter((c) => c.group === "total-value")
            .map((chart) => (
              <option key={chart.value} value={chart.value}>
                {chart.label}
              </option>
            ))}
        </optgroup>
      </select>

      {/* Visual indicator with icon */}
      <div className={styles.iconIndicator}>
        <SelectedIcon size={16} />
      </div>
    </div>
  );
};

export default ChartTypeSelector;
