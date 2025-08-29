// src/components/charts/PivotTable.jsx
import React, { useMemo } from "react";

const combineClasses = (...classes) => {
  return classes.filter(Boolean).join(" ");
};

const numberFormatter = (value, decimals = 0) => {
  return Number(value).toFixed(decimals);
};

export const PivotTable = ({
  data,
  config,
  isLoading = false,
  className = "",
}) => {
  // Transform data for table display
  const tableData = useMemo(() => {
    if (!data || data.length === 0) return [];

    const dimensions = config?.dimensions || [];
    const metrics = config?.metrics || ["metric"];
    const rowLimit = config?.rowLimit || 100;

    // If no dimensions, just show metrics for each row
    if (dimensions.length === 0) {
      return data.slice(0, rowLimit).map((item, index) => ({
        id: index,
        dimension: `Row ${index + 1}`,
        metrics: metrics.reduce((acc, metric) => {
          acc[metric] =
            typeof item[metric] === "number"
              ? item[metric]
              : typeof item.metric === "number"
              ? item.metric
              : typeof item.value === "number"
              ? item.value
              : 0;
          return acc;
        }, {}),
      }));
    }

    // Group data by dimensions
    const grouped = data.reduce((acc, item) => {
      // Create dimension key
      const dimensionKey = dimensions
        .map((dim) => item[dim] || item.dimension || item.name || "Unknown")
        .join(" / ");

      if (!acc[dimensionKey]) {
        acc[dimensionKey] = {
          dimension: dimensionKey,
          metrics: metrics.reduce((metricAcc, metric) => {
            metricAcc[metric] = 0;
            return metricAcc;
          }, {}),
        };
      }

      // Add metric values
      metrics.forEach((metric) => {
        const value =
          typeof item[metric] === "number"
            ? item[metric]
            : typeof item.metric === "number"
            ? item.metric
            : typeof item.value === "number"
            ? item.value
            : 0;
        acc[dimensionKey].metrics[metric] += value;
      });

      return acc;
    }, {});

    // Convert to array and limit rows
    return Object.values(grouped)
      .map((item, index) => ({ ...item, id: index }))
      .slice(0, rowLimit);
  }, [data, config]);

  // Format metric values for display
  const formatMetricValue = (value) => {
    if (typeof value === "string") {
      return value;
    }
    return numberFormatter(value, 2).replace(/\.00$/, "");
  };

  // Format column headers
  const formatColumnHeader = (metricName) => {
    return metricName.charAt(0).toUpperCase() + metricName.slice(1);
  };

  const dimensions = config?.dimensions || [];
  const metrics = config?.metrics || ["metric"];

  // Handle empty data state
  if (!data || data.length === 0) {
    return (
      <div
        className={combineClasses(
          "flex h-full items-center justify-center",
          className
        )}
      >
        <div className="text-center">
          <p className="text-sm text-gray-500">No data available</p>
        </div>
      </div>
    );
  }

  // Handle transformation errors
  if (tableData.length === 0) {
    return (
      <div
        className={combineClasses(
          "flex h-full items-center justify-center",
          className
        )}
      >
        <div className="text-center">
          <p className="text-sm text-gray-500">
            Unable to process data for pivot table
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={combineClasses(
        "relative h-full overflow-auto px-5 pb-2",
        className
      )}
    >
      {isLoading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-white bg-opacity-80">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            <span>Refreshing data...</span>
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50 sticky top-0 z-10">
            <tr>
              {/* Dimension column header */}
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {dimensions.length > 0
                  ? dimensions.map(formatColumnHeader).join(" / ")
                  : "Dimension"}
              </th>

              {/* Metric column headers */}
              {metrics.map((metric) => (
                <th
                  key={metric}
                  className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  {formatColumnHeader(metric)}
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="bg-white divide-y divide-gray-200">
            {tableData.map((row) => (
              <tr key={row.id} className="hover:bg-gray-50">
                {/* Dimension column */}
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {row.dimension}
                </td>

                {/* Metric columns */}
                {metrics.map((metric) => (
                  <td
                    key={metric}
                    className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right tabular-nums"
                  >
                    {formatMetricValue(row.metrics[metric])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PivotTable;
