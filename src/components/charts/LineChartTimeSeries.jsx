// src/components/charts/LineChartTimeSeries.jsx
import React, { useMemo } from "react";
import {
  LineChart,
  Line,
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
  // First, group by time_dimension
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

  // Convert to array format for Recharts
  return Object.entries(timeGroups).map(([time, dimensions]) => ({
    time_dimension: time,
    ...dimensions,
  }));
};

// Extract unique dimensions
const getUniqueDimensions = (data) => {
  const uniqueDimensions = new Set();
  data.forEach((item) => {
    if (item.dimension) {
      uniqueDimensions.add(item.dimension);
    }
  });
  return Array.from(uniqueDimensions);
};

export const LineChartTimeSeries = ({
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

  // Colors for multiple lines
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
        <LineChart
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
            <Line
              key={dimension}
              type="monotone"
              dataKey={dimension}
              strokeWidth={2}
              dot={true}
              activeDot={{ r: 6, strokeWidth: 0 }}
              stroke={colors[index % colors.length]}
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
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default LineChartTimeSeries;
