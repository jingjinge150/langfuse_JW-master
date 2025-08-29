// src/components/charts/Chart.jsx
import React, { useState, useMemo } from "react";
import LineChartTimeSeries from "./LineChartTimeSeries.jsx";
import VerticalBarChartTimeSeries from "./VerticalBarChartTimeSeries.jsx";
import HorizontalBarChart from "./HorizontalBarChart.jsx";
import VerticalBarChart from "./VerticalBarChart.jsx";
import PieChart from "./PieChart.jsx";
import HistogramChart from "./HistogramChart.jsx";
import BigNumber from "./BigNumber.jsx";
import PivotTable from "./PivotTable.jsx";

const combineClasses = (...classes) => {
  return classes.filter(Boolean).join(" ");
};

// Chart type constants
export const CHART_TYPES = {
  LINE_TIME_SERIES: "LINE_TIME_SERIES",
  BAR_TIME_SERIES: "BAR_TIME_SERIES",
  HORIZONTAL_BAR: "HORIZONTAL_BAR",
  VERTICAL_BAR: "VERTICAL_BAR",
  PIE: "PIE",
  HISTOGRAM: "HISTOGRAM",
  NUMBER: "NUMBER",
  PIVOT_TABLE: "PIVOT_TABLE",
};

export const Chart = ({
  chartType,
  data,
  rowLimit,
  chartConfig,
  sortState,
  onSortChange,
  isLoading = false,
  className = "",
}) => {
  const [forceRender, setForceRender] = useState(false);
  const shouldWarn = data.length > 2000 && !forceRender;

  // Transform data with proper time formatting
  const renderedData = useMemo(() => {
    return data.map((item) => {
      return {
        ...item,
        time_dimension: item.time_dimension
          ? new Date(item.time_dimension).toLocaleTimeString("en-US", {
              year: "2-digit",
              month: "numeric",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })
          : undefined,
      };
    });
  }, [data]);

  const renderChart = () => {
    switch (chartType) {
      case CHART_TYPES.LINE_TIME_SERIES:
        return <LineChartTimeSeries data={renderedData} />;

      case CHART_TYPES.BAR_TIME_SERIES:
        return <VerticalBarChartTimeSeries data={renderedData} />;

      case CHART_TYPES.HORIZONTAL_BAR:
        return <HorizontalBarChart data={renderedData.slice(0, rowLimit)} />;

      case CHART_TYPES.VERTICAL_BAR:
        return <VerticalBarChart data={renderedData.slice(0, rowLimit)} />;

      case CHART_TYPES.PIE:
        return <PieChart data={renderedData.slice(0, rowLimit)} />;

      case CHART_TYPES.HISTOGRAM:
        return <HistogramChart data={renderedData} />;

      case CHART_TYPES.NUMBER:
        return <BigNumber data={renderedData} />;

      case CHART_TYPES.PIVOT_TABLE:
        // Extract pivot table configuration from chartConfig
        const pivotConfig = {
          dimensions: chartConfig?.dimensions ?? [],
          metrics: chartConfig?.metrics ?? ["metric"],
          rowLimit: chartConfig?.row_limit ?? rowLimit,
          defaultSort: chartConfig?.defaultSort,
        };
        return (
          <PivotTable
            data={renderedData}
            config={pivotConfig}
            sortState={sortState}
            onSortChange={onSortChange}
            isLoading={isLoading}
          />
        );

      default:
        return <HorizontalBarChart data={renderedData.slice(0, rowLimit)} />;
    }
  };

  const renderWarning = () => (
    <div className="flex flex-col items-center justify-center p-6 text-center">
      <div className="mb-4 h-12 w-12 text-yellow-500 text-4xl">⚠️</div>
      <h3 className="mb-2 text-lg font-semibold">Large Dataset Warning</h3>
      <p className="mb-6 text-sm text-gray-600">
        This chart has more than 2,000 unique data points. Rendering it may be
        slow or may crash your browser. Try to reduce the number of dimensions
        by adding more selective filters or choosing a coarser breakdown
        dimension.
      </p>
      <button
        onClick={() => setForceRender(true)}
        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium"
      >
        I understand, proceed to render the chart
      </button>
    </div>
  );

  return (
    <div className={combineClasses("h-full p-0", className)}>
      {shouldWarn ? renderWarning() : renderChart()}
    </div>
  );
};

export default Chart;
