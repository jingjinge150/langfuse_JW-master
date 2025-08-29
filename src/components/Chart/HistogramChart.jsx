// HistogramChart.jsx
import React from "react";
import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import styles from "./Chart.module.css";
import PropTypes from "prop-types";

function HistogramChart({ data = [], dataKey, nameKey }) {
  if (!data || data.length === 0) {
    return (
      <div className={styles.chartContainer}>
        <div className={styles.noData}>데이터가 없습니다</div>
      </div>
    );
  }

  return (
    <div className={styles.chartContainer}>
      <ResponsiveContainer width="100%" height={400}>
        <RechartsBarChart
          data={data}
          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
          barCategoryGap="1%"
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey={nameKey} />
          <YAxis />
          <Tooltip />
          <Bar dataKey={dataKey} fill="#60a5fa" />
        </RechartsBarChart>
      </ResponsiveContainer>
    </div>
  );
}

HistogramChart.propTypes = {
  data: PropTypes.array,
  dataKey: PropTypes.string.isRequired,
  nameKey: PropTypes.string.isRequired,
};

export default HistogramChart;
