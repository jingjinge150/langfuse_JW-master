// src/components/charts/chart-utils.js
import { CHART_TYPES } from "./chart-props.js";

/**
 * Groups data by dimension to prepare it for time series breakdowns
 * @param {Array} data - DataPoint array
 * @returns {Array} Grouped data for Recharts
 */
export const groupDataByTimeDimension = (data) => {
  // First, group by time_dimension
  const timeGroups = data.reduce((acc, item) => {
    const time = item.time_dimension || "Unknown";
    if (!acc[time]) {
      acc[time] = {};
    }

    const dimension = item.dimension || "Unknown";
    acc[time][dimension] = typeof item.metric === "number" ? item.metric : 0;

    return acc;
  }, {});

  // Convert to array format for Recharts
  return Object.entries(timeGroups).map(([time, dimensions]) => ({
    time_dimension: time,
    ...dimensions,
  }));
};

/**
 * Extract unique dimensions from data
 * @param {Array} data - DataPoint array
 * @returns {Array} Array of unique dimension strings
 */
export const getUniqueDimensions = (data) => {
  const uniqueDimensions = new Set();
  data.forEach((item) => {
    if (item.dimension) {
      uniqueDimensions.add(item.dimension);
    }
  });
  return Array.from(uniqueDimensions);
};

/**
 * Check if chart type is time series
 * @param {string} chartType
 * @returns {boolean}
 */
export const isTimeSeriesChart = (chartType) => {
  switch (chartType) {
    case CHART_TYPES.LINE_TIME_SERIES:
    case CHART_TYPES.BAR_TIME_SERIES:
      return true;
    case CHART_TYPES.HORIZONTAL_BAR:
    case CHART_TYPES.VERTICAL_BAR:
    case CHART_TYPES.PIE:
    case CHART_TYPES.HISTOGRAM:
    case CHART_TYPES.NUMBER:
    case CHART_TYPES.PIVOT_TABLE:
      return false;
    default:
      return false;
  }
};

/**
 * Format axis label - truncate if too long
 * @param {string} label
 * @returns {string}
 */
export const formatAxisLabel = (label) =>
  label.length > 13 ? label.slice(0, 13).concat("…") : label;

/**
 * Maps chart types to their human-readable display names
 * @param {string} chartType
 * @returns {string}
 */
export function getChartTypeDisplayName(chartType) {
  switch (chartType) {
    case CHART_TYPES.LINE_TIME_SERIES:
      return "Line Chart (Time Series)";
    case CHART_TYPES.BAR_TIME_SERIES:
      return "Bar Chart (Time Series)";
    case CHART_TYPES.HORIZONTAL_BAR:
      return "Horizontal Bar Chart (Total Value)";
    case CHART_TYPES.VERTICAL_BAR:
      return "Vertical Bar Chart (Total Value)";
    case CHART_TYPES.PIE:
      return "Pie Chart (Total Value)";
    case CHART_TYPES.NUMBER:
      return "Big Number (Total Value)";
    case CHART_TYPES.HISTOGRAM:
      return "Histogram (Total Value)";
    case CHART_TYPES.PIVOT_TABLE:
      return "Pivot Table (Total Value)";
    default:
      return "Unknown Chart Type";
  }
}

/**
 * Utility function to combine CSS classes (replaces cn utility)
 * @param  {...string} classes
 * @returns {string}
 */
export const combineClasses = (...classes) => {
  return classes.filter(Boolean).join(" ");
};

/**
 * Format large numbers with K, M, B, T suffixes
 * @param {number} value
 * @returns {string}
 */
export const compactSmallNumberFormatter = (value) => {
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

/**
 * Simple number formatter
 * @param {number} value
 * @param {number} decimals
 * @returns {string}
 */
export const numberFormatter = (value, decimals = 0) => {
  return Number(value).toFixed(decimals);
};
