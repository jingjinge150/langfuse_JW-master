// src/Pages/Widget/components/ChartPreview.jsx
import React, { useMemo } from "react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import styles from "./ChartPreview.module.css";

const ChartPreview = ({ chartType, data, loading, error, chartConfig }) => {
  // 디버그 로그를 컴포넌트 함수 안으로 이동
  console.log("🔍 ChartPreview Debug:", {
    chartType,
    dataLength: data?.length,
    data: data?.slice(0, 3), // 처음 3개만 로그
    loading,
    error,
    chartConfig,
  });

  // Transform data for different chart types
  const transformedData = useMemo(() => {
    if (!Array.isArray(data) || data.length === 0) return [];

    return data.map((item, index) => ({
      name:
        item.x ||
        item.name ||
        item.time_dimension ||
        item.dimension ||
        `Item ${index + 1}`,
      value: Number(item.y || item.value || item.metric || 0),
      ...item,
    }));
  }, [data]);

  const totalValue = useMemo(() => {
    return transformedData.reduce((sum, item) => sum + (item.value || 0), 0);
  }, [transformedData]);

  const colors = [
    "#4f46e5",
    "#06b6d4",
    "#10b981",
    "#f59e0b",
    "#ef4444",
    "#8b5cf6",
  ];

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingState}>
          <div className={styles.spinner}></div>
          <p>Loading chart preview...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.errorState}>
          <p className={styles.errorTitle}>Failed to load preview</p>
          <p className={styles.errorMessage}>{error}</p>
        </div>
      </div>
    );
  }

  if (transformedData.length === 0) {
    return (
      <div className={styles.container}>
        <div className={styles.emptyState}>
          <p>No data to display</p>
          <p className={styles.emptyHint}>
            Try adjusting your filters or date range
          </p>
        </div>
      </div>
    );
  }

  const renderChart = () => {
    switch (chartType) {
      case "LINE_TIME_SERIES":
        return (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={transformedData}>
              <XAxis
                dataKey="name"
                tick={{ fontSize: 12, fill: "#94a3b8" }}
                axisLine={{ stroke: "#334155" }}
              />
              <YAxis
                tick={{ fontSize: 12, fill: "#94a3b8" }}
                axisLine={{ stroke: "#334155" }}
              />
              <Line
                type="monotone"
                dataKey="value"
                stroke="#4f46e5"
                strokeWidth={2}
                dot={{ fill: "#4f46e5", strokeWidth: 2, r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        );

      case "BAR_TIME_SERIES":
      case "VERTICAL_BAR":
        return (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={transformedData.slice(0, chartConfig?.row_limit || 20)}
            >
              <XAxis
                dataKey="name"
                tick={{ fontSize: 12, fill: "#94a3b8" }}
                axisLine={{ stroke: "#334155" }}
              />
              <YAxis
                tick={{ fontSize: 12, fill: "#94a3b8" }}
                axisLine={{ stroke: "#334155" }}
              />
              <Bar dataKey="value" fill="#4f46e5" />
            </BarChart>
          </ResponsiveContainer>
        );

      case "HORIZONTAL_BAR":
        return (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              layout="horizontal"
              data={transformedData.slice(0, chartConfig?.row_limit || 20)}
            >
              <XAxis type="number" tick={{ fontSize: 12, fill: "#94a3b8" }} />
              <YAxis
                type="category"
                dataKey="name"
                tick={{ fontSize: 12, fill: "#94a3b8" }}
                width={80}
              />
              <Bar dataKey="value" fill="#4f46e5" />
            </BarChart>
          </ResponsiveContainer>
        );

      case "PIE":
        return (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={transformedData.slice(0, chartConfig?.row_limit || 10)}
                cx="50%"
                cy="50%"
                outerRadius={80}
                dataKey="value"
                label={({ name, percent }) =>
                  `${name} ${(percent * 100).toFixed(0)}%`
                }
              >
                {transformedData
                  .slice(0, chartConfig?.row_limit || 10)
                  .map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={colors[index % colors.length]}
                    />
                  ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        );

      case "NUMBER":
        return (
          <div className={styles.bigNumberContainer}>
            <div className={styles.bigNumber}>
              {totalValue.toLocaleString()}
            </div>
            <div className={styles.bigNumberLabel}>Total Value</div>
          </div>
        );

      case "HISTOGRAM":
        // For histogram, create bins from the data
        const binCount = chartConfig?.bins || 10;
        const values = transformedData
          .map((d) => d.value)
          .filter((v) => typeof v === "number");
        if (values.length === 0)
          return <div className={styles.emptyState}>No numeric data</div>;

        const min = Math.min(...values);
        const max = Math.max(...values);
        const binSize = (max - min) / binCount;

        const bins = Array.from({ length: binCount }, (_, i) => ({
          name: `${(min + i * binSize).toFixed(1)}-${(
            min +
            (i + 1) * binSize
          ).toFixed(1)}`,
          value: 0,
        }));

        values.forEach((value) => {
          const binIndex = Math.min(
            Math.floor((value - min) / binSize),
            binCount - 1
          );
          bins[binIndex].value++;
        });

        return (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={bins}>
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#94a3b8" }} />
              <YAxis tick={{ fontSize: 12, fill: "#94a3b8" }} />
              <Bar dataKey="value" fill="#4f46e5" />
            </BarChart>
          </ResponsiveContainer>
        );

      default:
        return (
          <div className={styles.emptyState}>
            Unsupported chart type: {chartType}
          </div>
        );
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.chartContainer}>{renderChart()}</div>
    </div>
  );
};

export default ChartPreview;
