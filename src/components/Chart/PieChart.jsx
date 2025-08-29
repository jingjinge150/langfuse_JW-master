// DonutChart.jsx
import React from "react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";
import styles from "./Chart.module.css";
import PropTypes from "prop-types";

const COLORS = ["#60a5fa", "#34d399", "#facc15", "#fb923c", "#f87171"];

function DonutChart({ data = [], dataKey, nameKey }) {
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
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={120}
            paddingAngle={5}
            dataKey={dataKey}
            nameKey={nameKey}
          >
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={COLORS[index % COLORS.length]}
              />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

DonutChart.propTypes = {
  data: PropTypes.array,
  dataKey: PropTypes.string.isRequired,
  nameKey: PropTypes.string.isRequired,
};

export default DonutChart;
