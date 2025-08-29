// src/Pages/Widget/WidgetDashboard.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

// 절대 경로로 수정 (alias 사용)
import widgetAPI from "./services";
// 부모(대시보드) 스타일 재사용해서 "모양 그대로"
import dashStyles from "../DashBoard/Dashboards.module.css";

function fmt(d) {
  if (!d) return "-";
  try {
    return new Date(d).toLocaleString("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return d;
  }
}

function normalize(raw) {
  const ownerRaw =
    raw.owner ??
    raw.ownedBy ??
    raw.projectOwner ??
    (typeof raw.createdBy === "string" ? raw.createdBy : raw.createdBy?.name);
  const owner =
    (ownerRaw?.toString()?.toUpperCase().includes("LANGFUSE")
      ? "LANGFUSE"
      : "PROJECT") || "PROJECT";
  return {
    id: raw.id || raw.widgetId,
    name: raw.name || "(no name)",
    description: raw.description || "",
    viewType: raw.viewType || raw.view || "",
    chartType: raw.chartType || raw.chartConfig?.type || "",
    createdAt: raw.createdAt || raw.createTime || null,
    updatedAt: raw.updatedAt || raw.updateTime || null,
    owner,
  };
}

const templateNameRules = [
  /^count\b/i,
  /scores?_numeric/i,
  /scores?_categorical/i,
  /\btraces?\b/i,
  /\bobservations?\b/i,
];

const looksLikeTemplate = (w) =>
  w.owner === "LANGFUSE" ||
  templateNameRules.some((re) => re.test(w.name || ""));

/** props.embedded: true → 상단 헤더/탭 없이 테이블만 렌더 (부모 스타일 그대로) */
const WidgetDashboard = ({ embedded = false }) => {
  const navigate = useNavigate();
  const [widgets, setWidgets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState(null);

  async function testConnection() {
    console.log("연결 테스트 시작...");
    try {
      const result = await widgetAPI.testConnection();
      setConnectionStatus(result);
      console.log("연결 테스트 결과:", result);
      return result.success;
    } catch (error) {
      console.error("연결 테스트 중 오류:", error);
      setConnectionStatus({ success: false, message: error.message });
      return false;
    }
  }

  async function load() {
    try {
      setLoading(true);
      setErr(null);

      console.log("위젯 데이터 로드 시작...");

      // 먼저 연결 테스트
      const isConnected = await testConnection();
      if (!isConnected) {
        setErr(
          "Langfuse 서버에 연결할 수 없습니다. 서버가 실행 중인지 확인해주세요."
        );
        return;
      }

      const res = await widgetAPI.getWidgets(1, 500);
      console.log("위젯 API 응답:", res);

      if (res.success === false) {
        setErr(res.error || "위젯 목록을 불러오는데 실패했습니다.");
        return;
      }

      const rows = Array.isArray(res?.data) ? res.data : res?.widgets || [];
      console.log("원본 위젯 데이터:", rows);

      if (rows.length === 0) {
        console.log("위젯이 없습니다.");
        setWidgets([]);
        return;
      }

      const normalized = rows.map(normalize).filter((w) => !!w.id);
      console.log("정규화된 위젯:", normalized);

      // 템플릿 필터링 비활성화: 모든 위젯 표시
      const visible = normalized;
      setWidgets(visible);
    } catch (e) {
      console.error("위젯 로드 중 오류:", e);
      setErr(`위젯 목록을 불러오지 못했습니다: ${e.message}`);
      setWidgets([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const goEdit = (w) =>
    navigate(`/widgets/${w.id}/edit`, { state: { widget: w } });

  const deleteOne = async (w) => {
    if (!confirm(`"${w.name}" 위젯을 삭제할까요?`)) return;
    try {
      const r = await widgetAPI.deleteWidget(w.id);
      if (r?.success === false) return alert(r?.error || "삭제 실패");
      await load();
    } catch (e) {
      console.error(e);
      alert("삭제 중 오류가 발생했습니다.");
    }
  };

  if (loading) {
    return (
      <div
        className={dashStyles.tableContainer}
        style={{ padding: "24px", textAlign: "center" }}
      >
        <div>불러오는 중…</div>
        {connectionStatus && (
          <div style={{ marginTop: "10px", fontSize: "14px", color: "#666" }}>
            연결 상태:{" "}
            {connectionStatus.success
              ? "✅ 연결됨"
              : `❌ ${connectionStatus.message}`}
          </div>
        )}
      </div>
    );
  }

  if (err) {
    return (
      <div
        className={dashStyles.tableContainer}
        style={{ padding: "24px", textAlign: "center" }}
      >
        <div style={{ color: "#ef4444", marginBottom: "16px" }}>{err}</div>
        {connectionStatus && (
          <div
            style={{ fontSize: "14px", color: "#666", marginBottom: "16px" }}
          >
            연결 상태:{" "}
            {connectionStatus.success
              ? "✅ 연결됨"
              : `❌ ${connectionStatus.message}`}
          </div>
        )}
        <button
          onClick={load}
          style={{
            padding: "8px 16px",
            backgroundColor: "#3b82f6",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          다시 시도
        </button>
      </div>
    );
  }

  // 부모 스타일 그대로 사용 — 상단 파란 "+ New Widget" 버튼/헤더는 완전히 제거
  return (
    <div className={dashStyles.tableContainer}>
      <table className={dashStyles.table}>
        <thead>
          <tr>
            <th>Name</th>
            <th>Description</th>
            <th>View Type</th>
            <th>Chart Type</th>
            <th>Created At</th>
            <th>Updated At</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {widgets.length === 0 ? (
            <tr>
              <td colSpan={7} style={{ textAlign: "center", padding: "32px" }}>
                <div>위젯이 없습니다.</div>
                <div
                  style={{ fontSize: "14px", color: "#666", marginTop: "8px" }}
                >
                  Langfuse에서 위젯을 생성하거나 다른 프로젝트 ID를
                  확인해보세요.
                </div>
              </td>
            </tr>
          ) : (
            widgets.map((w) => (
              <tr key={w.id}>
                <td>
                  <button
                    className={dashStyles.dashboardLink}
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                    }}
                    onClick={() => goEdit(w)}
                    title="Edit widget"
                  >
                    {w.name}
                  </button>
                </td>
                <td>{w.description || "-"}</td>
                <td>{w.viewType || "-"}</td>
                <td>{w.chartType || "-"}</td>
                <td style={{ fontSize: 13, color: "#64748b" }}>
                  {fmt(w.createdAt)}
                </td>
                <td style={{ fontSize: 13, color: "#64748b" }}>
                  {fmt(w.updatedAt)}
                </td>
                <td>
                  <button
                    className={dashStyles.iconButton}
                    onClick={() => goEdit(w)}
                    title="Edit"
                  >
                    ✏️
                  </button>
                  <button
                    className={dashStyles.iconButton}
                    onClick={() => deleteOne(w)}
                    title="Delete"
                    style={{ color: "#ef4444" }}
                  >
                    🗑️
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default WidgetDashboard;
