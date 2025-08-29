// src/Pages/Widget/components/ChartTypeSelector.jsx
import React from 'react';
import styles from './ChartTypeSelector.module.css';

const ChartTypeSelector = ({ value, onChange }) => {
  const chartTypes = [
    { value: 'LINE_TIME_SERIES', label: 'Line Chart (Time Series)' },
    { value: 'BAR_TIME_SERIES', label: 'Bar Chart (Time Series)' },
    { value: 'HORIZONTAL_BAR', label: 'Horizontal Bar Chart' },
    { value: 'VERTICAL_BAR', label: 'Vertical Bar Chart' },
    { value: 'PIE', label: 'Pie Chart' },
    { value: 'NUMBER', label: 'Big Number' },
    { value: 'HISTOGRAM', label: 'Histogram' },
    { value: 'PIVOT_TABLE', label: 'Pivot Table' },
  ];

  return (
    <select 
      className={styles.select}
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      {chartTypes.map(type => (
        <option key={type.value} value={type.value}>
          {type.label}
        </option>
      ))}
    </select>
  );
};

export default ChartTypeSelector;