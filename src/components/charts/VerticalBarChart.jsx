// src/components/charts/VerticalBarChart.jsx
import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

const combineClasses = (...classes) => {
  return classes.filter(Boolean).join(" ");
};

export const VerticalBarChart = ({
  data,
  config = {
    metric: {
      theme: {
        light: "hsl(var(--chart-1))",
        dark: "hsl(var(--chart-1))",
      },
    },
  },
  accessibilityLayer = true,
  className = "",
}) => {
  // Transform data to ensure proper format
  const chartData = data.map((item) => ({
    ...item,
    dimension: item.dimension || item.name || "Unknown",
    metric:
      typeof item.metric === "number"
        ? item.metric
        : typeof item.value === "number"
        ? item.value
        : 0,
  }));

  return (
    <div className={combineClasses("w-full h-full", className)}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
        >
          <XAxis
            type="category"
            dataKey="dimension"
            stroke="#94a3b8"
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            type="number"
            stroke="#94a3b8"
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <Bar dataKey="metric" radius={[4, 4, 0, 0]} fill="#4f46e5" />
          <Tooltip
            contentStyle={{
              backgroundColor: "white",
              border: "1px solid #e5e7eb",
              borderRadius: "8px",
              boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
            }}
            itemStyle={{ color: "#374151" }}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default VerticalBarChart;
