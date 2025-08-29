// src/Pages/Widget/pages/WidgetDetail.jsx
import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import widgetAPI from "../services";
import styles from "./WidgetDetail.module.css";

const Box = ({ title, children }) => (
  <div className={styles.box}>
    <div className={styles.boxTitle}>{title}</div>
    <div className={styles.boxBody}>{children}</div>
  </div>
);

export default function WidgetDetail() {
  const { widgetId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [widget, setWidget] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const data = await widgetAPI.getWidget(widgetId);
        if (!data) throw new Error("Widget not found");
        setWidget(data);
      } catch (e) {
        setError(e.message || "Failed to load widget");
      } finally {
        setLoading(false);
      }
    })();
  }, [widgetId]);

  if (loading) return <div className={styles.status}>Loading…</div>;
  if (error)
    return <div className={`${styles.status} ${styles.error}`}>{error}</div>;
  if (!widget) return <div className={styles.status}>Not found</div>;

  return (
    <div className={styles.container}>
      {/* 헤더 */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>{widget.name}</h1>
          <div className={styles.subtitle}>
            {widget.description || "No description"}
          </div>
        </div>
        <div className={styles.actions}>
          <button
            onClick={() => navigate("/dashboards")}
            className={styles.btnLight}
          >
            Back to Dashboards
          </button>
        </div>
      </div>

      {/* 메타 정보 */}
      <div className={styles.grid}>
        <Box title="Basic">
          <div>
            <b>View:</b> {widget.view}
          </div>
          <div>
            <b>Chart Type:</b> {widget.chartType}
          </div>
          <div>
            <b>Updated:</b>{" "}
            {new Date(
              widget.updatedAt || widget.updated_at || Date.now()
            ).toLocaleString()}
          </div>
        </Box>

        <Box title="Metrics & Dimensions">
          <div>
            <b>Metrics:</b>{" "}
            {Array.isArray(widget.metrics)
              ? widget.metrics
                  .map((m) => `${m.columnId || m.measure} (${m.aggregation})`)
                  .join(", ")
              : "-"}
          </div>
          <div>
            <b>Dimensions:</b>{" "}
            {Array.isArray(widget.dimensions) && widget.dimensions.length
              ? widget.dimensions.join(", ")
              : "None"}
          </div>
        </Box>

        <Box title="Date Range">
          <div>
            <b>From:</b>{" "}
            {widget.fromTimestamp
              ? new Date(widget.fromTimestamp).toLocaleString()
              : "-"}
          </div>
          <div>
            <b>To:</b>{" "}
            {widget.toTimestamp
              ? new Date(widget.toTimestamp).toLocaleString()
              : "-"}
          </div>
        </Box>

        <Box title="Filters">
          {Array.isArray(widget.filters) && widget.filters.length ? (
            <ul className={styles.list}>
              {widget.filters.map((f, i) => (
                <li key={i}>
                  {f.column} {f.operator} {String(f.value)}
                </li>
              ))}
            </ul>
          ) : (
            <div>None</div>
          )}
        </Box>
      </div>

      {/* 프리뷰 박스 */}
      <Box title="Preview (disabled)">
        <div className={styles.previewNote}>
          차트 렌더링은 비활성화되어 있습니다. (필요 시 Chart 컴포넌트 연결)
        </div>
      </Box>

      {/* 위젯이 속한 대시보드 목록 */}
      {Array.isArray(widget.dashboards) && widget.dashboards.length > 0 && (
        <Box title="Dashboards containing this widget">
          <ul className={styles.list}>
            {widget.dashboards.map((d) => (
              <li key={d.id}>
                <Link to={`/dashboards/${d.id}`}>{d.name}</Link>
              </li>
            ))}
          </ul>
        </Box>
      )}
    </div>
  );
}
