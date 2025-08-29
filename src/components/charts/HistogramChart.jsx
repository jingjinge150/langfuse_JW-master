// src/components/charts/HistogramChart.jsx
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

const compactSmallNumberFormatter = (value) => {
  if (Math.abs(value) >= 1e12) {
    return (value / 1e12).toFixed(1).replace(/\.0$/, "") + "T";
  } else if (Math.abs(value) >= 1e9) {
    return (value / 1e9).toFixed(1).replace(/\.0$/, "") + "B";
  } else if (Math.abs(value) >= 1e6) {
    return (value / 1e6).toFixed(1).replace(/\.0$/, "") + "M";
  } else if (Math.abs(value) >= 1e3) {
    return (value / 1e3).toFixed(1).replace(/\.0$/, "") + "K";
  }
  return value.toString();
};

const HistogramChart = ({ data, className = "" }) => {
  const transformHistogramData = (data) => {
    if (!data.length) return [];

    // Check if this is ClickHouse histogram format (array of tuples)
    const firstDataPoint = data[0];
    if (firstDataPoint?.metric && Array.isArray(firstDataPoint.metric)) {
      // ClickHouse histogram format: [(lower, upper, height), ...]
      return firstDataPoint.metric.map(([lower, upper, height]) => ({
        binLabel: `[${compactSmallNumberFormatter(
          lower
        )}, ${compactSmallNumberFormatter(upper)}]`,
        count: height,
        lower,
        upper,
        height,
      }));
    }

    // Fallback: treat as regular data points with binLabel
    return data.map((item, index) => ({
      binLabel: item.dimension || item.name || `Bin ${index + 1}`,
      count:
        typeof item.metric === "number"
          ? item.metric
          : typeof item.value === "number"
          ? item.value
          : 0,
    }));
  };

  const histogramData = transformHistogramData(data);

  if (!histogramData.length) {
    return (
      <div
        className={combineClasses(
          "flex h-full items-center justify-center text-gray-500",
          className
        )}
      >
        No data available
      </div>
    );
  }

  return (
    <div className={combineClasses("w-full h-full", className)}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={histogramData}
          margin={{ top: 20, right: 30, left: 20, bottom: 90 }}
        >
          <XAxis
            dataKey="binLabel"
            stroke="#94a3b8"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            angle={-45}
            textAnchor="end"
            height={90}
          />
          <YAxis
            stroke="#94a3b8"
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <Bar dataKey="count" fill="#4f46e5" radius={[2, 2, 0, 0]} />
          <Tooltip
            contentStyle={{
              backgroundColor: "white",
              border: "1px solid #e5e7eb",
              borderRadius: "8px",
              boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
            }}
            formatter={(value, name) => [
              `${value}`,
              name === "count" ? "Count" : name,
            ]}
            labelFormatter={(label) => `Bin: ${label}`}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default HistogramChart;
