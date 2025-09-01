// src/Pages/Widget/pages/NewWidgetPage.jsx
import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import api from "../services";
import styles from "../NewWidget.module.css";

// Components
import DateRangePicker from "../components/DateRangePicker";
import AdvancedFilters from "../components/AdvancedFilters";
import ViewMetricSelector from "../components/ViewMetricSelector";
import ChartTypeSelector from "../components/ChartTypeSelector";
import ChartPreview from "../components/ChartPreview";
import DashboardModal from "../components/DashboardModal";

const toISO = (d) => (d ? new Date(d).toISOString() : null);
const isTimeSeriesChart = (t) =>
  ["LINE_TIME_SERIES", "BAR_TIME_SERIES"].includes(String(t));

const DIMENSION_ALIAS = {
  traceName: "name",
  user: "userId",
  session: "sessionId",
};
const normalizeDim = (dim) => DIMENSION_ALIAS[dim] ?? dim;

const sanitizeFilters = (filters = []) => {
  if (!Array.isArray(filters)) return [];
  return filters
    .map((f) => {
      const field = f.field ?? f.column ?? f.id ?? f.name;
      const operator = (f.operator ?? f.op ?? "").toString().toLowerCase();
      let value =
        f.value ??
        f.values ??
        (Array.isArray(f.list) ? [...f.list] : undefined);

      if (typeof value === "string") value = value.trim();

      if (
        (operator === "in" || operator === "not in") &&
        typeof value === "string"
      ) {
        value = value
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
      }

      const isEmptyString = value === "" || value == null;
      const isEmptyArray = Array.isArray(value) && value.length === 0;

      if (operator === "contains" && isEmptyString) return null;
      if ((operator === "in" || operator === "not in") && isEmptyArray)
        return null;

      return { field, operator, value, type: f.type || "string" };
    })
    .filter(Boolean);
};

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

  // Data Selection
  const [view, setView] = useState("traces");
  const [measure, setMeasure] = useState("count");
  const [aggregation, setAggregation] = useState("count");
  const [metrics, setMetrics] = useState([
    { measure: "count", aggregation: "count" },
  ]);

  // Dimensions for Pivot
  const [rowDim1, setRowDim1] = useState("none");
  const [rowDim2, setRowDim2] = useState("none");

  // Visualization
  const [chartType, setChartType] = useState("LINE_TIME_SERIES");
  const [rowLimit, setRowLimit] = useState(100);
  const [bins, setBins] = useState(10);

  // Pivot Sort
  const [pivotSortColumn, setPivotSortColumn] = useState("");
  const [pivotSortOrder, setPivotSortOrder] = useState("desc");

  // Filters
  const [filters, setFilters] = useState([]);

  // Date Range
  const [startDate, setStartDate] = useState(
    new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  );
  const [endDate, setEndDate] = useState(new Date());

  // Texts
  const [{ name, description }, setTexts] = useState(() =>
    buildDefaultTexts({ aggregation, measure, view, dimension: "none" })
  );

  // Preview
  const [loading, setLoading] = useState(false);
  const [previewError, setPreviewError] = useState("");
  const [previewData, setPreviewData] = useState([]);
  const [debugInfo, setDebugInfo] = useState({});
  const [showDebug, setShowDebug] = useState(false);

  // Dashboard Modal
  const [showDashboardModal, setShowDashboardModal] = useState(false);
  const [saving, setSaving] = useState(false);

  // Auto-correct aggregation
  useEffect(() => {
    if (chartType === "HISTOGRAM" && aggregation !== "histogram") {
      setAggregation("histogram");
    } else if (chartType !== "HISTOGRAM" && aggregation === "histogram") {
      setAggregation(measure === "count" ? "count" : "sum");
    } else if (measure === "count" && aggregation !== "count") {
      setAggregation("count");
    }
  }, [chartType, measure, aggregation]);

  // Auto texts
  useEffect(() => {
    setTexts(
      buildDefaultTexts({ aggregation, measure, view, dimension: "none" })
    );
  }, [aggregation, measure, view]);

  // Build query
  const query = useMemo(() => {
    const cleanedFilters = sanitizeFilters(filters);

    const dims = [];
    if (chartType === "PIVOT_TABLE") {
      if (rowDim1 !== "none") dims.push({ field: normalizeDim(rowDim1) });
      if (rowDim2 !== "none") dims.push({ field: normalizeDim(rowDim2) });
    }

    let usedMetrics = [];
    if (chartType === "HISTOGRAM") {
      usedMetrics = [{ measure: "count", aggregation: "histogram" }];
    } else if (chartType === "PIVOT_TABLE") {
      usedMetrics =
        metrics.length > 0
          ? metrics
          : [{ measure: "count", aggregation: "count" }];
    } else {
      usedMetrics = [{ measure, aggregation }];
    }

    return {
      view,
      dimensions: dims,
      metrics: usedMetrics,
      filters: cleanedFilters,
      timeDimension: isTimeSeriesChart(chartType)
        ? { granularity: "auto" }
        : null,
      fromTimestamp: toISO(startDate),
      toTimestamp: toISO(endDate),
      orderBy: null,
      chartConfig:
        chartType === "HISTOGRAM"
          ? { type: chartType, bins }
          : {
              type: chartType,
              row_limit: rowLimit,
              ...(chartType === "PIVOT_TABLE"
                ? {
                    pivot: {
                      sortColumn: pivotSortColumn || null,
                      sortOrder: pivotSortOrder,
                    },
                  }
                : {}),
            },
    };
  }, [
    view,
    chartType,
    measure,
    aggregation,
    metrics,
    rowDim1,
    rowDim2,
    filters,
    startDate,
    endDate,
    rowLimit,
    bins,
    pivotSortColumn,
    pivotSortOrder,
  ]);

  // Preview fetch
  const refreshPreview = useCallback(async () => {
    if (!projectId) {
      console.warn("🚨 No project ID available");
      return;
    }
    setLoading(true);
    setPreviewError("");

    try {
      const columnsResponse = await api.getFilterColumns(view);
      const columns = columnsResponse?.data || [];

      const res = await api.executeQuery(query, columns);
      const chartData = res?.data?.chartData || res?.chartData || [];

      setDebugInfo({
        query,
        columns,
        response: res,
        chartData,
        timestamp: new Date().toISOString(),
      });

      setPreviewData(Array.isArray(chartData) ? chartData : []);
    } catch (e) {
      console.error("❌ Preview error:", e);
      setPreviewError(e?.message || String(e));
      setPreviewData([]);
      setDebugInfo({
        query,
        error: e,
        errorMessage: e?.message,
        timestamp: new Date().toISOString(),
      });
    } finally {
      setLoading(false);
    }
  }, [projectId, query, view]);

  // API projectId 세팅
  useEffect(() => {
    if (projectId) {
      api.projectId = projectId;
      console.log("🔧 API project ID set to:", projectId);
    }
  }, [projectId]);

  // 의존성 변경 시 프리뷰 갱신
  useEffect(() => {
    refreshPreview();
  }, [refreshPreview]);

  // Save with Dashboard Selection
  const handleSaveWithDashboard = async (dashboardId) => {
    setSaving(true);
    try {
      const payload = {
        name: name || "Untitled Widget",
        description: description || "",
        view,
        dimensions: [
          ...(rowDim1 !== "none" ? [normalizeDim(rowDim1)] : []),
          ...(rowDim2 !== "none" ? [normalizeDim(rowDim2)] : []),
        ],
        metrics:
          chartType === "PIVOT_TABLE"
            ? metrics
            : [
                {
                  measure,
                  aggregation:
                    chartType === "HISTOGRAM" ? "histogram" : aggregation,
                },
              ],
        filters: sanitizeFilters(filters).map((f) => ({
          column: f.field || f.column,
          operator: f.operator,
          value: f.value,
        })),
        chartType,
        chartConfig:
          chartType === "HISTOGRAM"
            ? { type: chartType, bins }
            : {
                type: chartType,
                row_limit: rowLimit,
                ...(chartType === "PIVOT_TABLE"
                  ? {
                      pivot: {
                        sortColumn: pivotSortColumn || null,
                        sortOrder: pivotSortOrder,
                      },
                    }
                  : {}),
              },
        fromTimestamp: toISO(startDate),
        toTimestamp: toISO(endDate),
        timeDimension: isTimeSeriesChart(chartType)
          ? { granularity: "auto" }
          : null,
      };

      if (dashboardId) payload.dashboardId = dashboardId;

      let result;
      if (api._widgets && typeof api._widgets.createWidget === "function") {
        result = await api._widgets.createWidget(payload);
      } else {
        result = await api.trpcPost("dashboardWidgets.create", payload);
      }

      if (dashboardId) {
        alert("위젯이 대시보드에 추가되었습니다!");
        navigate(`/dashboards/${dashboardId}`);
      } else {
        alert("위젯이 저장되었습니다!");
        navigate("/dashboards", { state: { activeTab: "Widgets" } });
      }
    } catch (error) {
      console.error("❌ Save error:", error);
      alert(`저장 실패: ${error.message}`);
    } finally {
      setSaving(false);
      setShowDashboardModal(false);
    }
  };

  const handleSave = () => setShowDashboardModal(true);

  return (
    <div className={styles.pageWrap}>
      {/* 왼쪽 패널 - 설정 */}
      <div className={styles.leftPane}>
        <div className={styles.section}>
          <h3>Data Selection</h3>

          {/* Pivot Table일 때 Langfuse 스타일 UI */}
          {chartType === "PIVOT_TABLE" ? (
            <>
              <div className={styles.block}>
                <label className={styles.label}>View</label>
                <select
                  className={styles.select}
                  value={view}
                  onChange={(e) => setView(e.target.value)}
                >
                  <option value="traces">Traces</option>
                  <option value="observations">Observations</option>
                  <option value="scores">Scores</option>
                </select>
              </div>

              <div className={styles.block}>
                <label className={styles.label}>Metrics</label>
                <div style={{ marginBottom: "8px" }}>
                  <span className={styles.helperText}>Metric 1 (Required)</span>
                </div>
                <select
                  className={styles.select}
                  value={metrics[0]?.measure || "count"}
                  onChange={(e) => {
                    const newMetrics = [...metrics];
                    if (!newMetrics[0])
                      newMetrics[0] = { aggregation: "count" };
                    newMetrics[0].measure = e.target.value;
                    setMetrics(newMetrics);
                  }}
                >
                  <option value="count">Count</option>
                  <option value="latency">Latency</option>
                  <option value="observations_count">Observations Count</option>
                  <option value="scores_count">Scores Count</option>
                  <option value="totalCost">Total Cost</option>
                  <option value="totalTokens">Total Tokens</option>
                  <option value="duration">Duration</option>
                  <option value="cost">Cost</option>
                  <option value="input_tokens">Input Tokens</option>
                  <option value="output_tokens">Output Tokens</option>
                </select>

                {/* Metric 2 추가 버튼 또는 두 번째 메트릭 */}
                {metrics.length === 1 ? (
                  <button
                    type="button"
                    className={styles.secondaryBtn}
                    style={{
                      marginTop: "12px",
                      width: "100%",
                      textAlign: "center",
                    }}
                    onClick={() => {
                      setMetrics([
                        ...metrics,
                        { measure: "count", aggregation: "count" },
                      ]);
                    }}
                  >
                    + Add Metric 2
                  </button>
                ) : (
                  <div style={{ marginTop: "12px" }}>
                    <div style={{ marginBottom: "8px" }}>
                      <span className={styles.helperText}>
                        Metric 2 (Optional)
                      </span>
                    </div>
                    <div style={{ display: "flex", gap: "8px" }}>
                      <select
                        className={styles.select}
                        value={metrics[1]?.measure || "count"}
                        onChange={(e) => {
                          const newMetrics = [...metrics];
                          if (!newMetrics[1])
                            newMetrics[1] = { aggregation: "count" };
                          newMetrics[1].measure = e.target.value;
                          setMetrics(newMetrics);
                        }}
                        style={{ flex: 1 }}
                      >
                        <option value="count">Count</option>
                        <option value="latency">Latency</option>
                        <option value="observations_count">
                          Observations Count
                        </option>
                        <option value="scores_count">Scores Count</option>
                        <option value="totalCost">Total Cost</option>
                        <option value="totalTokens">Total Tokens</option>
                        <option value="duration">Duration</option>
                        <option value="cost">Cost</option>
                        <option value="input_tokens">Input Tokens</option>
                        <option value="output_tokens">Output Tokens</option>
                      </select>
                      <button
                        type="button"
                        className={styles.secondaryBtn}
                        onClick={() => setMetrics([metrics[0]])}
                        style={{ padding: "8px 12px" }}
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                )}

                {/* 세 번째 메트릭 추가 버튼 */}
                {metrics.length === 2 && (
                  <button
                    type="button"
                    className={styles.secondaryBtn}
                    style={{
                      marginTop: "12px",
                      width: "100%",
                      textAlign: "center",
                    }}
                    onClick={() => {
                      setMetrics([
                        ...metrics,
                        { measure: "count", aggregation: "count" },
                      ]);
                    }}
                  >
                    + Add Metric 3
                  </button>
                )}
              </div>

              <div className={styles.block}>
                <label className={styles.label}>Filters</label>
                <AdvancedFilters
                  value={filters}
                  onChange={setFilters}
                  view={view}
                />
              </div>

              <div
                style={{
                  borderTop: "1px solid #1e293b",
                  marginTop: "16px",
                  paddingTop: "16px",
                }}
              >
                <label className={styles.label}>Row Dimensions</label>
                <p
                  className={styles.helperText}
                  style={{ marginBottom: "12px" }}
                >
                  Configure up to 2 dimensions for pivot table rows. Each
                  dimension creates groupings with subtotals.
                </p>

                <div style={{ marginBottom: "12px" }}>
                  <span className={styles.helperText}>
                    Dimension 1 (Optional)
                  </span>
                  <select
                    className={styles.select}
                    value={rowDim1}
                    onChange={(e) => {
                      setRowDim1(e.target.value);
                      if (e.target.value === "none") setRowDim2("none");
                    }}
                    style={{ marginTop: "4px" }}
                  >
                    <option value="none">Select a dimension</option>
                    <option value="environment">Environment</option>
                    <option value="traceName">Trace Name</option>
                    <option value="release">Release</option>
                    <option value="version">Version</option>
                    <option value="user">User</option>
                    <option value="session">Session</option>
                  </select>
                </div>

                <div style={{ marginBottom: "12px" }}>
                  <span className={styles.helperText}>
                    Dimension 2 (Optional)
                  </span>
                  <select
                    className={styles.select}
                    value={rowDim2}
                    onChange={(e) => setRowDim2(e.target.value)}
                    disabled={rowDim1 === "none"}
                    style={{ marginTop: "4px" }}
                  >
                    <option value="none">
                      {rowDim1 === "none"
                        ? "Select previous dimension first"
                        : "Select a dimension"}
                    </option>
                    <option value="environment">Environment</option>
                    <option value="traceName">Trace Name</option>
                    <option value="release">Release</option>
                    <option value="version">Version</option>
                    <option value="user">User</option>
                    <option value="session">Session</option>
                  </select>
                </div>
              </div>

              <div className={styles.block}>
                <label className={styles.label}>
                  Default Sort Configuration
                </label>
                <p
                  className={styles.helperText}
                  style={{ marginBottom: "12px" }}
                >
                  Configure the default sort order for the pivot table. This
                  will be applied when the widget is first loaded.
                </p>

                <div style={{ marginBottom: "12px" }}>
                  <span className={styles.helperText}>Sort Column</span>
                  <select
                    className={styles.select}
                    value={pivotSortColumn}
                    onChange={(e) => setPivotSortColumn(e.target.value)}
                    style={{ marginTop: "4px" }}
                  >
                    <option value="">No default sort</option>
                    <option value="count">Count</option>
                  </select>
                </div>

                <div className={styles.row} style={{ gap: "8px" }}>
                  <div style={{ flex: 1 }}>
                    <span className={styles.helperText}>Sort Order</span>
                    <select
                      className={styles.select}
                      value={pivotSortOrder}
                      onChange={(e) => setPivotSortOrder(e.target.value)}
                      style={{ marginTop: "4px" }}
                    >
                      <option value="desc">Descending (Z-A)</option>
                      <option value="asc">Ascending (A-Z)</option>
                    </select>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Pivot Table이 아닐 때는 ViewMetricSelector 사용 */}
              <ViewMetricSelector
                view={view}
                onChangeView={setView}
                measure={measure}
                onChangeMeasure={setMeasure}
                aggregation={aggregation}
                onChangeAggregation={setAggregation}
                disabled={chartType === "HISTOGRAM"}
              />

              <div className={styles.block}>
                <label className={styles.label}>Filters</label>
                <AdvancedFilters
                  value={filters}
                  onChange={setFilters}
                  view={view}
                />
              </div>
            </>
          )}
        </div>

        <div className={styles.section}>
          <h3>Visualization</h3>

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

          <div className={styles.block}>
            <label className={styles.label}>Chart Type</label>
            <ChartTypeSelector value={chartType} onChange={setChartType} />
          </div>

          <div className={styles.block}>
            <label className={styles.label}>Date Range</label>
            <DateRangePicker
              startDate={startDate}
              endDate={endDate}
              setStartDate={setStartDate}
              setEndDate={setEndDate}
            />
          </div>

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
          ) : !isTimeSeriesChart(chartType) && chartType !== "PIVOT_TABLE" ? (
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

          <button
            className={styles.primaryBtn}
            onClick={handleSave}
            disabled={loading || saving}
          >
            {saving ? "저장 중..." : "Save Widget"}
          </button>
        </div>
      </div>

      {/* 오른쪽 패널 - 미리보기 */}
      <div className={styles.rightPane}>
        <div className={styles.previewHeader}>
          <div className={styles.previewTitle}>{name}</div>
          <div className={styles.previewDesc}>{description}</div>
          {previewData.length > 0 && (
            <div className={styles.dataCounter}>
              Data points: {previewData.length}
            </div>
          )}
        </div>

        <div className={styles.chartContainer}>
          <div className={styles.chartWrapper}>
            <ChartPreview
              chartType={chartType}
              data={previewData}
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
      </div>

      {/* Dashboard Selection Modal */}
      <DashboardModal
        isOpen={showDashboardModal}
        onClose={() => setShowDashboardModal(false)}
        onSave={handleSaveWithDashboard}
        projectId={projectId}
        api={api}
      />
    </div>
  );
}
