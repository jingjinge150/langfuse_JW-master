// src/components/charts/chart-props.js

/**
 * @typedef {Object} DataPoint
 * @property {string|undefined} time_dimension
 * @property {string|undefined} dimension
 * @property {number|Array<Array<number>>} metric
 */

/**
 * @typedef {Object} ChartConfig
 * @property {Object} [metric]
 * @property {Object} [metric.theme]
 * @property {string} [metric.theme.light]
 * @property {string} [metric.theme.dark]
 */

/**
 * @typedef {Object} ChartProps
 * @property {DataPoint[]} data
 * @property {ChartConfig} [config]
 * @property {boolean} [accessibilityLayer]
 */

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

export default CHART_TYPES;
