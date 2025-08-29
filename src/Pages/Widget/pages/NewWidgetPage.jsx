// src/Pages/Widget/NewWidgetPage.jsx
import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import api from "../services";
import styles from "../NewWidget.module.css";

// Components
import DateRangePicker from "../../../components/DateRange/DateRangePicker";
import AdvancedFilters from "../components/AdvancedFilters";
import ViewMetricSelector from "../components/ViewMetricSelector";
import ChartTypeSelector from "../components/ChartTypeSelector";
import ChartPreview from "../components/ChartPreview";

const toISO = (d) => (d ? new Date(d).toISOString() : null);
const isTimeSeriesChart = (t) =>
  ["LINE_TIME_SERIES", "BAR_TIME_SERIES"].includes(String(t));

const buildDefaultTexts = ({ aggregation, measure, view, dimension }) => {
  const agg = (aggregation || "count").toString().toUpperCase();
  const mea = (measure || "count").toString().toUpperCase();
  const vw = (view || "traces").toString();
  const dim =
    !dimension || dimension === "none" ? "" : ` by ${String(dimension)}`;
  const name = `${agg} ${mea} (${vw})${dim}`;
  const desc = `Shows the ${
    agg === "COUNT" ? "count" : agg.toLowerCase()
  } of ${mea.toLowerCase()} from ${vw}${dim}`;
  return { name, desc };
};

export default function NewWidgetPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const projectId =
    params.get("projectId") || import.meta.env.VITE_LANGFUSE_PROJECT_ID || "";

  // Data Selection States
  const [view, setView] = useState("traces");
  const [measure, setMeasure] = useState("count");
  const [aggregation, setAggregation] = useState("count");
  const [dimension, setDimension] = useState("none");

  // Visualization States
  const [chartType, setChartType] = useState("LINE_TIME_SERIES");
  const [rowLimit, setRowLimit] = useState(100);
  const [bins, setBins] = useState(10);

  // Filters State
  const [filters, setFilters] = useState([]);

  // Date Range State - Updated structure
  const [startDate, setStartDate] = useState(
    new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  );
  const [endDate, setEndDate] = useState(new Date());

  // Text States
  const [{ name, description }, setTexts] = useState(() =>
    buildDefaultTexts({ aggregation, measure, view, dimension })
  );

  // Preview States
  const [loading, setLoading] = useState(false);
  const [previewError, setPreviewError] = useState("");
  const [previewData, setPreviewData] = useState([]);

  // Auto-correct aggregation based on chart type and measure
  useEffect(() => {
    if (chartType === "HISTOGRAM" && aggregation !== "histogram") {
      setAggregation("histogram");
    } else if (chartType !== "HISTOGRAM" && aggregation === "histogram") {
      setAggregation(measure === "count" ? "count" : "sum");
    } else if (measure === "count" && aggregation !== "count") {
      setAggregation("count");
    }
  }, [chartType, measure, aggregation]);

  // Auto-update widget name and description
  useEffect(() => {
    setTexts(buildDefaultTexts({ aggregation, measure, view, dimension }));
  }, [aggregation, measure, view, dimension]);

  // Build query for preview
  const query = useMemo(() => {
    const dims = dimension !== "none" ? [{ field: dimension }] : [];
    const metrics = [{ measure, aggregation }];

    return {
      view,
      dimensions: dims,
      metrics,
      filters: [...filters],
      timeDimension: isTimeSeriesChart(chartType)
        ? { granularity: "auto" }
        : null,
      fromTimestamp: toISO(startDate),
      toTimestamp: toISO(endDate),
      orderBy: null,
      chartConfig:
        chartType === "HISTOGRAM"
          ? { type: chartType, bins }
          : { type: chartType, row_limit: rowLimit },
    };
  }, [
    view,
    dimension,
    measure,
    aggregation,
    filters,
    chartType,
    rowLimit,
    bins,
    startDate,
    endDate,
  ]);

  // Preview data fetching
  const refreshPreview = useCallback(async () => {
    if (!projectId) return;

    setLoading(true);
    setPreviewError("");

    try {
      const columns = await api
        .getFilterColumns(view)
        .then((r) => r.data || []);
      const res = await api.executeQuery(query, columns);
      const chartData = res?.data?.chartData || [];
      setPreviewData(Array.isArray(chartData) ? chartData : []);
    } catch (e) {
      setPreviewError(e?.message || String(e));
      setPreviewData([]);
      console.error("Preview error:", e);
    } finally {
      setLoading(false);
    }
  }, [projectId, query, view]);

  // Set project ID and refresh preview when dependencies change
  useEffect(() => {
    api.projectId = projectId || api.projectId || "";
  }, [projectId]);

  useEffect(() => {
    refreshPreview();
  }, [refreshPreview]);

  // Save widget handler
  const handleSave = async () => {
    try {
      const payload = {
        name,
        description,
        view,
        dimensions: dimension !== "none" ? [{ field: dimension }] : [],
        metrics: [{ measure, agg: aggregation }],
        filters,
        chartType,
        chartConfig:
          chartType === "HISTOGRAM"
            ? { type: chartType, bins }
            : { type: chartType, row_limit: rowLimit },
        projectId,
        fromTimestamp: toISO(startDate),
        toTimestamp: toISO(endDate),
      };

      if (typeof api?._widgets?.createWidget === "function") {
        await api._widgets.createWidget(payload);
      } else if (typeof api.callTRPCAsREST === "function") {
        await api.callTRPCAsREST("dashboardWidgets.create", "POST", payload);
      } else {
        alert("Save API가 연결되어 있지 않습니다.");
        return;
      }

      alert("Widget saved successfully! ✅");
      navigate("/dashboards");
    } catch (e) {
      alert(`Save failed: ${e?.message || e}`);
      console.error("Save error:", e);
    }
  };

  return (
    <div className={styles.pageWrap}>
      {/* Left Panel - Configuration */}
      <div className={styles.leftPane}>
        {/* Data Selection Section */}
        <div className={styles.section}>
          <h3>Data Selection</h3>

          {/* View & Metric Selector */}
          <ViewMetricSelector
            view={view}
            onChangeView={setView}
            measure={measure}
            onChangeMeasure={setMeasure}
            aggregation={aggregation}
            onChangeAggregation={setAggregation}
            disabled={chartType === "HISTOGRAM"}
          />

          {/* Filters */}
          <div className={styles.block}>
            <label className={styles.label}>Filters</label>
            <AdvancedFilters
              value={filters}
              onChange={setFilters}
              view={view}
            />
          </div>

          {/* Breakdown Dimension */}
          <div className={styles.block}>
            <label className={styles.label}>
              Breakdown Dimension (Optional)
            </label>
            <select
              className={styles.select}
              value={dimension}
              onChange={(e) => setDimension(e.target.value)}
            >
              <option value="none">None</option>
              <option value="environment">Environment</option>
              <option value="traceName">Trace Name</option>
              <option value="release">Release</option>
              <option value="version">Version</option>
              <option value="user">User</option>
              <option value="session">Session</option>
              <option value="tags">Tags</option>
            </select>
          </div>
        </div>

        {/* Visualization Section */}
        <div className={styles.section}>
          <h3>Visualization</h3>

          {/* Widget Name */}
          <div className={styles.block}>
            <label className={styles.label}>Name</label>
            <input
              className={styles.input}
              value={name}
              onChange={(e) =>
                setTexts((t) => ({ ...t, name: e.target.value }))
              }
              placeholder="Widget name"
            />
          </div>

          {/* Widget Description */}
          <div className={styles.block}>
            <label className={styles.label}>Description</label>
            <input
              className={styles.input}
              value={description}
              onChange={(e) =>
                setTexts((t) => ({ ...t, description: e.target.value }))
              }
              placeholder="Widget description"
            />
          </div>

          {/* Chart Type */}
          <div className={styles.block}>
            <label className={styles.label}>Chart Type</label>
            <ChartTypeSelector value={chartType} onChange={setChartType} />
          </div>

          {/* Date Range */}
          <div className={styles.block}>
            <label className={styles.label}>Date Range</label>
            <DateRangePicker
              startDate={startDate}
              endDate={endDate}
              setStartDate={setStartDate}
              setEndDate={setEndDate}
            />
          </div>

          {/* Chart-specific options */}
          {chartType === "HISTOGRAM" ? (
            <div className={styles.block}>
              <label className={styles.label}>Bins (1-100)</label>
              <input
                type="number"
                min={1}
                max={100}
                className={styles.input}
                value={bins}
                onChange={(e) => setBins(parseInt(e.target.value || "10", 10))}
              />
            </div>
          ) : !isTimeSeriesChart(chartType) ? (
            <div className={styles.block}>
              <label className={styles.label}>
                Breakdown Row Limit (0-1000)
              </label>
              <input
                type="number"
                min={0}
                max={1000}
                className={styles.input}
                value={rowLimit}
                onChange={(e) =>
                  setRowLimit(parseInt(e.target.value || "100", 10))
                }
              />
            </div>
          ) : null}

          {/* Save Button */}
          <button className={styles.primaryBtn} onClick={handleSave}>
            Save Widget
          </button>
        </div>
      </div>

      {/* Right Panel - Preview */}
      <div className={styles.rightPane}>
        <div className={styles.previewHeader}>
          <div className={styles.previewTitle}>{name}</div>
          <div className={styles.previewDesc}>{description}</div>
        </div>

        <ChartPreview
          chartType={chartType}
          data={previewData}
          rowLimit={rowLimit}
          chartConfig={
            chartType === "HISTOGRAM"
              ? { type: chartType, bins }
              : { type: chartType, row_limit: rowLimit }
          }
          loading={loading}
          error={previewError}
        />
      </div>
    </div>
  );
}
