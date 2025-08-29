// BarChart.jsx
import React from "react";
import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LabelList,
} from "recharts";
import styles from "./Chart.module.css";
import PropTypes from "prop-types";

function BarChart({ data = [], dataKey, nameKey, layout = "horizontal" }) {
  const isVerticalLayout = layout === "vertical";

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
          layout={layout}
          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          {isVerticalLayout ? (
            <>
              <XAxis type="number" />
              <YAxis type="category" dataKey={nameKey} />
            </>
          ) : (
            <>
              <XAxis type="category" dataKey={nameKey} />
              <YAxis type="number" />
            </>
          )}
          <Tooltip />
          <Bar dataKey={dataKey} fill="#60a5fa">
            {isVerticalLayout && (
              <LabelList dataKey={dataKey} position="right" />
            )}
          </Bar>
        </RechartsBarChart>
      </ResponsiveContainer>
    </div>
  );
}

BarChart.propTypes = {
  data: PropTypes.array,
  dataKey: PropTypes.string.isRequired,
  nameKey: PropTypes.string.isRequired,
  layout: PropTypes.oneOf(["horizontal", "vertical"]),
};

BarChart.defaultProps = {
  data: [],
  layout: "horizontal",
};

export default BarChart;
