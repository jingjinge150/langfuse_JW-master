// src/Pages/Widget/pages/NewWidgetPage.jsx
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

  // Save with Dashboard Selection - 수정된 버전
  const handleSaveWithDashboard = async (dashboardId) => {
    setSaving(true);
    try {
      const payload = {
        name: name || "Untitled Widget",
        description: description || "",
        view,
        dimensions: dimension !== "none" ? [normalizeDim(dimension)] : [],
        metrics: [
          {
            measure,
            aggregation: chartType === "HISTOGRAM" ? "histogram" : aggregation,
          },
        ],
        filters: sanitizeFilters(filters).map((f) => ({
          column: f.field || f.column,
          operator: f.operator,
          value: f.value,
        })),
        chartType,
        chartConfig: {
          type: chartType,
          ...(chartType === "HISTOGRAM" ? { bins } : { row_limit: rowLimit }),
        },
        fromTimestamp: toISO(startDate),
        toTimestamp: toISO(endDate),
        timeDimension: isTimeSeriesChart(chartType)
          ? { granularity: "auto" }
          : null,
      };

      // dashboardId가 있으면 포함 (Skip이면 null)
      if (dashboardId) {
        payload.dashboardId = dashboardId;
      }

      console.log("💾 Saving widget:", JSON.stringify(payload, null, 2));

      // API 호출
      let result;
      if (api._widgets && typeof api._widgets.createWidget === "function") {
        result = await api._widgets.createWidget(payload);
      } else {
        result = await api.trpcPost("dashboardWidgets.create", payload);
      }

      console.log("✅ Widget saved successfully:", result);

      // 성공 처리
      if (dashboardId) {
        alert("위젯이 대시보드에 추가되었습니다!");
        navigate(`/dashboards/${dashboardId}`);
      } else {
        alert("위젯이 저장되었습니다!");
        navigate("/dashboards", { state: { activeTab: "Widgets" } });
      }
    } catch (error) {
      console.error("❌ Save error:", error);

      let errorMessage = "위젯 저장에 실패했습니다.";
      if (error.message.includes("400")) {
        errorMessage =
          "요청 데이터가 올바르지 않습니다. 모든 필드를 확인해주세요.";
      } else if (error.message.includes("401")) {
        errorMessage = "인증에 실패했습니다. API 키를 확인해주세요.";
      }

      alert(`${errorMessage}\n\n상세: ${error.message}`);
    } finally {
      setSaving(false);
      setShowDashboardModal(false);
    }
  };

  // Save 버튼 클릭 핸들러
  const handleSave = () => {
    setShowDashboardModal(true);
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

      {/* 왼쪽 패널 - 설정 */}
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
