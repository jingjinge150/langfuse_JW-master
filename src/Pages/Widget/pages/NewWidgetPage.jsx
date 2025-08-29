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

/** 서버 스키마에 맞게 차원명 정규화 */
const DIMENSION_ALIAS = {
  traceName: "name",
  user: "userId",
  session: "sessionId",
};
const normalizeDim = (dim) => DIMENSION_ALIAS[dim] ?? dim;

/** 빈 값/의미 없는 필터 제거 */
const sanitizeFilters = (filters = []) => {
  if (!Array.isArray(filters)) return [];
  return filters
    .map((f) => {
      const field = f.field ?? f.column ?? f.id ?? f.name;
      const operator = (f.operator ?? f.op ?? "").toString().toLowerCase();
      let value =
        f.value ?? f.values ?? (Array.isArray(f.list) ? [...f.list] : undefined);

      if (typeof value === "string") value = value.trim();

      if ((operator === "in" || operator === "not in") && typeof value === "string") {
        value = value
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
      }

      const isEmptyString = value === "" || value == null;
      const isEmptyArray = Array.isArray(value) && value.length === 0;

      if (operator === "contains" && isEmptyString) return null;
      if ((operator === "in" || operator === "not in") && isEmptyArray) return null;

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
  const [dimension, setDimension] = useState("none");

  // Visualization
  const [chartType, setChartType] = useState("LINE_TIME_SERIES");
  const [rowLimit, setRowLimit] = useState(100);
  const [bins, setBins] = useState(10);

  // Filters
  const [filters, setFilters] = useState([]);

  // Date Range
  const [startDate, setStartDate] = useState(
    new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  );
  const [endDate, setEndDate] = useState(new Date());

  // Texts
  const [{ name, description }, setTexts] = useState(() =>
    buildDefaultTexts({ aggregation, measure, view, dimension })
  );

  // Preview
  const [loading, setLoading] = useState(false);
  const [previewError, setPreviewError] = useState("");
  const [previewData, setPreviewData] = useState([]);
  const [debugInfo, setDebugInfo] = useState({});
  const [showDebug, setShowDebug] = useState(false);

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
    setTexts(buildDefaultTexts({ aggregation, measure, view, dimension }));
  }, [aggregation, measure, view, dimension]);

  // Build query
  const query = useMemo(() => {
    const normalizedDimension =
      dimension !== "none" ? normalizeDim(dimension) : null;
    const cleanedFilters = sanitizeFilters(filters);
    const metrics = [{ measure, aggregation }];

    return {
      view,
      dimensions: normalizedDimension ? [{ field: normalizedDimension }] : [],
      metrics,
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

  // Preview fetch
  const refreshPreview = useCallback(async () => {
    if (!projectId) {
      console.warn("🚨 No project ID available");
      return;
    }
    setLoading(true);
    setPreviewError("");

    try {
      console.log("📋 Query being sent:", JSON.stringify(query, null, 2));

      // 1) 필터 컬럼 메타
      const columnsResponse = await api.getFilterColumns(view);
      const columns = columnsResponse?.data || [];

      // 2) 쿼리 실행
      const res = await api.executeQuery(query, columns);

      // 3) 차트 데이터 추출
      const chartData = res?.data?.chartData || res?.chartData || [];

      // 4) 디버그용
      setDebugInfo({
        query,
        columns,
        response: res,
        chartData,
        timestamp: new Date().toISOString(),
      });

      // 5) 미리보기 데이터 반영
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

  // Save
  const handleSave = async () => {
    try {
      const payload = {
        name,
        description,
        view,
        dimensions: dimension !== "none" ? [{ field: normalizeDim(dimension) }] : [],
        metrics: [{ measure, agg: aggregation }],
        filters: sanitizeFilters(filters),
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
        alert(`Save API가 연결되어 있지 않습니다.\n\nPayload:\n${JSON.stringify(payload, null, 2)}`);
        return;
      }

      alert("Widget saved successfully! ✅");
      navigate("/dashboards");
    } catch (e) {
      console.error("❌ Save error:", e);
      alert(`Save failed: ${e?.message || e}`);
    }
  };

  return (
    <div className={styles.pageWrap}>
      {/* Debug Panel */}
      {showDebug && (
        <div className={styles.debugPanel}>
          <div className={styles.debugHeader}>
            <h4 className={styles.debugTitle}>Debug Information</h4>
            <button
              className={styles.debugCloseBtn}
              onClick={() => setShowDebug(false)}
            >
              Close
            </button>
          </div>
          <div className={styles.debugContent}>
            {JSON.stringify(debugInfo, null, 2)}
          </div>
        </div>
      )}

      {/* Left */}
      <div className={styles.leftPane}>
        <div className={styles.section}>
          <h3>Data Selection</h3>

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

          <div className={styles.block}>
            <label className={styles.label}>Breakdown Dimension (Optional)</label>
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

        <div className={styles.section}>
          <h3>Visualization</h3>

          <div className={styles.block}>
            <label className={styles.label}>Name</label>
            <input
              className={styles.input}
              value={name}
              onChange={(e) => setTexts((t) => ({ ...t, name: e.target.value }))}
              placeholder="Widget name"
            />
          </div>

          <div className={styles.block}>
            <label className={styles.label}>Description</label>
            <input
              className={styles.input}
              value={description}
              onChange={(e) => setTexts((t) => ({ ...t, description: e.target.value }))}
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
          ) : !isTimeSeriesChart(chartType) ? (
            <div className={styles.block}>
              <label className={styles.label}>Breakdown Row Limit (0-1000)</label>
              <input
                type="number"
                min={0}
                max={1000}
                className={styles.input}
                value={rowLimit}
                onChange={(e) => setRowLimit(parseInt(e.target.value || "100", 10))}
              />
            </div>
          ) : null}

          <button
            className={styles.primaryBtn}
            onClick={handleSave}
            disabled={loading}
          >
            Save Widget
          </button>
        </div>
      </div>

      {/* Right - Preview */}
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
    </div>
  );
}
