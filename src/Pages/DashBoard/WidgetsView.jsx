// src/Pages/DashBoard/WidgetsView.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { DataTable } from "../../components/DataTable/DataTable";
import {
  Bot,
  ChevronDown,
  ChevronUp,
  MoreVertical,
  Edit,
  Trash2,
} from "lucide-react";
import styles from "./Dashboards.module.css";

// 위젯 API
import widgetAPI, { widgetListAPI } from "../Widget/services";

const formatDate = (dateString) => {
  if (!dateString) return "";
  try {
    return new Date(dateString).toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return dateString;
  }
};

const normalizeWidget = (raw, idx = 0) => {
  const idCandidates = [
    raw.id,
    raw.widgetId,
    raw.uid,
    raw._id,
    raw.uuid,
    raw.key,
    raw.slug,
  ];
  const id =
    idCandidates.find((v) => typeof v === "string" && v.length > 0) ??
    idCandidates.find((v) => typeof v === "number") ??
    `__temp_${idx}`;
  const name =
    raw.name ||
    raw.title ||
    raw.label ||
    (raw.chartConfig?.title ?? "") ||
    "(no name)";
  const ownerRaw =
    raw.owner ??
    raw.ownedBy ??
    raw.projectOwner ??
    (typeof raw.createdBy === "string" ? raw.createdBy : raw.createdBy?.name);
  const owner =
    (ownerRaw?.toString()?.toUpperCase().includes("LANGFUSE")
      ? "LANGFUSE"
      : "PROJECT") || "PROJECT";
  const viewType = raw.viewType || raw.view || raw.type || "";
  const chartType =
    raw.chartType || raw.chartConfig?.type || raw.config?.type || "";

  return {
    id,
    name,
    description: raw.description || raw.desc || "",
    owner,
    viewType,
    chartType,
    createdAt: raw.createdAt || raw.createTime || raw.created_at || null,
    updatedAt: raw.updatedAt || raw.updateTime || raw.updated_at || null,
    _raw: raw,
  };
};

const ActionDropdown = ({ row, onEdit, onDelete }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const onDocClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target))
        setIsOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const handle = (fn) => (e) => {
    e.stopPropagation();
    setIsOpen(false);
    fn(row);
  };

  return (
    <div className={styles.actionDropdown} ref={dropdownRef}>
      <button
        className={styles.actionButton}
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen((v) => !v);
        }}
      >
        <MoreVertical size={16} />
      </button>
      {isOpen && (
        <div className={styles.dropdownMenu}>
          <button className={styles.dropdownItem} onClick={handle(onEdit)}>
            <Edit size={14} />
            Edit
          </button>
          <button
            className={`${styles.dropdownItem} ${styles.deleteItem}`}
            onClick={handle(onDelete)}
          >
            <Trash2 size={14} />
            Delete
          </button>
        </div>
      )}
    </div>
  );
};

export const WidgetsView = () => {
  const navigate = useNavigate();
  const [widgets, setWidgets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortConfig, setSortConfig] = useState({
    key: "updatedAt",
    direction: "desc",
  });

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);

        // 간단 연결 체크 (실패해도 목록 시도)
        const ping = await widgetAPI.testConnection();
        if (!ping?.success) console.warn("Langfuse 연결 실패:", ping?.message);

        // 목록
        const res = await widgetListAPI.getWidgets(1, 50, "DESC");
        const rows = Array.isArray(res?.data) ? res.data : res?.widgets || [];
        setWidgets(rows.map((r, i) => normalizeWidget(r, i)));
      } catch (e) {
        console.error("Failed to fetch widgets:", e);
        alert(`위젯 목록을 불러오지 못했습니다: ${e?.message || e}`);
        setWidgets([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc")
      direction = "desc";
    setSortConfig({ key, direction });
  };

  const sortedWidgets = useMemo(() => {
    const items = [...widgets];
    const { key, direction } = sortConfig;
    items.sort((a, b) => {
      let av = a[key],
        bv = b[key];
      if (key === "updatedAt" || key === "createdAt") {
        av = av ? new Date(av).getTime() : 0;
        bv = bv ? new Date(bv).getTime() : 0;
      }
      if (av < bv) return direction === "asc" ? -1 : 1;
      if (av > bv) return direction === "asc" ? 1 : -1;
      return 0;
    });
    return items;
  }, [widgets, sortConfig]);

  const handleEdit = (row) => {
    navigate(`/widgets/${row.id}/edit`, { state: { widget: row._raw } });
  };

  const handleDelete = async (row) => {
    if (!window.confirm(`"${row.name}" 위젯을 삭제할까요?`)) return;
    try {
      const r = await widgetListAPI.deleteWidget(row.id);
      if (r?.success === false) {
        alert(r?.error || "삭제 실패");
        return;
      }
      const res = await widgetListAPI.getWidgets(1, 50, "DESC");
      const rows = Array.isArray(res?.data) ? res.data : res?.widgets || [];
      setWidgets(rows.map((r, i) => normalizeWidget(r, i)));
    } catch (e) {
      console.error("Delete widget failed:", e);
      alert("삭제 중 오류가 발생했습니다.");
    }
  };

  const columns = [
    {
      header: "Name",
      accessor: (row) => (
        <button
          className={styles.dashboardLink}
          style={{ background: "none", border: "none", cursor: "pointer" }}
          onClick={() => handleEdit(row)}
          title="Edit widget"
        >
          {row.name}
        </button>
      ),
    },
    {
      header: "Description",
      accessor: (row) =>
        row.description || <em style={{ color: "#64748b" }}>No description</em>,
    },
    {
      header: "Owner",
      accessor: (row) => (
        <div className={styles.ownerCell}>
          <Bot size={16} />
          <span>{row.owner === "LANGFUSE" ? "Langfuse" : "Project"}</span>
        </div>
      ),
    },
    {
      header: "View Type",
      accessor: (row) =>
        row.viewType || <em style={{ color: "#64748b" }}>-</em>,
    },
    {
      header: "Chart Type",
      accessor: (row) =>
        row.chartType || <em style={{ color: "#64748b" }}>-</em>,
    },
    { header: "Created At", accessor: (row) => formatDate(row.createdAt) },
    {
      header: (
        <div
          className={styles.sortableHeader}
          onClick={() => handleSort("updatedAt")}
        >
          Updated At{" "}
          {sortConfig.key === "updatedAt" ? (
            sortConfig.direction === "asc" ? (
              <ChevronUp size={14} className={styles.sortIconActive} />
            ) : (
              <ChevronDown size={14} className={styles.sortIconActive} />
            )
          ) : (
            <ChevronDown size={14} className={styles.sortIcon} />
          )}
        </div>
      ),
      accessor: (row) => formatDate(row.updatedAt),
    },
    {
      header: "Actions",
      accessor: (row) => (
        <ActionDropdown row={row} onEdit={handleEdit} onDelete={handleDelete} />
      ),
    },
  ];

  if (loading) return <div>Loading widgets...</div>;

  return (
    <DataTable
      columns={columns}
      data={sortedWidgets}
      keyField="id"
      renderEmptyState={() => (
        <div style={{ padding: "40px", textAlign: "center" }}>
          <p>위젯을 찾을 수 없습니다.</p>
          <p style={{ color: "#666", marginTop: "10px" }}>
            Langfuse에서 위젯을 먼저 생성해주세요.
          </p>
        </div>
      )}
    />
  );
};
