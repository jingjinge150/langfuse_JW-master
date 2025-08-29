// src/components/charts/VerticalBarChartTimeSeries.jsx
import React, { useMemo } from "react";
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

// Group data by time dimension for time series
const groupDataByTimeDimension = (data) => {
  const timeGroups = data.reduce((acc, item) => {
    const time = item.time_dimension || "Unknown";
    if (!acc[time]) {
      acc[time] = {};
    }

    const dimension = item.dimension || "Unknown";
    acc[time][dimension] =
      typeof item.metric === "number"
        ? item.metric
        : typeof item.value === "number"
        ? item.value
        : 0;

    return acc;
  }, {});

  return Object.entries(timeGroups).map(([time, dimensions]) => ({
    time_dimension: time,
    ...dimensions,
  }));
};

const getUniqueDimensions = (data) => {
  const uniqueDimensions = new Set();
  data.forEach((item) => {
    if (item.dimension) {
      uniqueDimensions.add(item.dimension);
    }
  });
  return Array.from(uniqueDimensions);
};

export const VerticalBarChartTimeSeries = ({
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
  const groupedData = useMemo(() => groupDataByTimeDimension(data), [data]);
  const dimensions = useMemo(() => getUniqueDimensions(data), [data]);

  // Colors for multiple bars
  const colors = [
    "#4f46e5",
    "#06b6d4",
    "#10b981",
    "#f59e0b",
    "#ef4444",
    "#8b5cf6",
  ];

  return (
    <div className={combineClasses("w-full h-full", className)}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={groupedData}
          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
        >
          <XAxis
            dataKey="time_dimension"
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
          {dimensions.map((dimension, index) => (
            <Bar
              key={dimension}
              dataKey={dimension}
              stroke={colors[index % colors.length]}
              fill={colors[index % colors.length]}
              stackId={dimensions.length > 1 ? "stack" : undefined}
            />
          ))}
          <Tooltip
            contentStyle={{
              backgroundColor: "white",
              border: "1px solid #e5e7eb",
              borderRadius: "8px",
              boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
            }}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default VerticalBarChartTimeSeries;
