// src/components/charts/PieChart.jsx
import React, { useMemo } from "react";
import {
  PieChart as PieChartComponent,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

const combineClasses = (...classes) => {
  return classes.filter(Boolean).join(" ");
};

export const PieChart = ({
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
  // Calculate total metric value for center label
  const totalValue = useMemo(() => {
    return data.reduce((acc, curr) => {
      const metric =
        typeof curr.metric === "number"
          ? curr.metric
          : typeof curr.value === "number"
          ? curr.value
          : 0;
      return acc + metric;
    }, 0);
  }, [data]);

  // Transform data for PieChart
  const chartData = useMemo(() => {
    return data.map((item, index) => ({
      name: item.dimension || item.name || "Unknown",
      value:
        typeof item.metric === "number"
          ? item.metric
          : typeof item.value === "number"
          ? item.value
          : 0,
      fill: `hsl(var(--chart-${(index % 4) + 1}))`,
    }));
  }, [data]);

  // Colors for pie segments
  const colors = [
    "#4f46e5",
    "#06b6d4",
    "#10b981",
    "#f59e0b",
    "#ef4444",
    "#8b5cf6",
  ];

  return (
    <div
      className={combineClasses(
        "w-full h-full relative flex items-center justify-center",
        className
      )}
    >
      <ResponsiveContainer width="100%" height="100%">
        <PieChartComponent>
          <Tooltip
            contentStyle={{
              backgroundColor: "white",
              border: "1px solid #e5e7eb",
              borderRadius: "8px",
              boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
            }}
            itemStyle={{ color: "#374151" }}
          />
          <Pie
            data={chartData}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            innerRadius={80}
            outerRadius={120}
            paddingAngle={2}
            strokeWidth={5}
          >
            {chartData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={colors[index % colors.length]}
              />
            ))}
          </Pie>
        </PieChartComponent>
      </ResponsiveContainer>

      {/* Center label with total */}
      <div className="absolute flex flex-col items-center justify-center pointer-events-none">
        <div className="text-3xl font-bold text-gray-900">
          {totalValue.toLocaleString()}
        </div>
        <div className="text-sm text-gray-500">Total</div>
      </div>
    </div>
  );
};

export default PieChart;
