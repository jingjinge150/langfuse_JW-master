import React, { useMemo, useRef, useState, useEffect } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from "recharts";

/** 밝은 색 팔레트(다크 배경에서도 보이게) */
const AXIS_COLOR = "#E5E7EB";     // gray-200
const GRID_COLOR = "#334155";     // slate-700
const LINE_COLOR = "#22D3EE";     // cyan-400
const BAR_FILL   = "#60A5FA";     // blue-400
const PIE_FILLS  = ["#60A5FA","#34D399","#F472B6","#FBBF24","#A78BFA","#F87171"];

export default function ChartPreview({
  chartType = "LINE_TIME_SERIES",
  data = [],
  chartConfig = {},
  loading = false,
  error = "",
}) {
  // 1) 어떤 형태든 {x,y}로 표준화
  const rows = useMemo(() => {
    const arr = Array.isArray(data) ? data : [];
    return arr.map((r, i) => ({
      x:
        r.x ??
        r.time_dimension ??
        r.timestamp ??
        r.date ??
        r.bucket ??
        r.name ??
        r.dimension ??
        `Point ${i + 1}`,
      y: Number(r.y ?? r.value ?? r.metric ?? r.count ?? r.total ?? 0),
      __raw: r,
    }));
  }, [data]);

  // 2) 데이터가 비어도 축/스캐폴딩 보이게 0 한 점 보정
  const safeRows = useMemo(() => {
    if (rows.length) return rows;
    return [{ x: new Date().toISOString(), y: 0 }];
  }, [rows]);

  // 3) 컨테이너 넓이 0 탐지(레이아웃 문제 힌트 제공)
  const hostRef = useRef(null);
  const [w, setW] = useState(0);
  useEffect(() => {
    if (!hostRef.current) return;
    const ro = new ResizeObserver(([entry]) => {
      setW(entry.contentRect.width);
    });
    ro.observe(hostRef.current);
    return () => ro.disconnect();
  }, []);

  const fmtX = (v) => {
    const d = new Date(v);
    if (isNaN(d)) return String(v);
    return d.toLocaleString("en-US", {
      month: "numeric",
      day: "2-digit",
      year: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const Skeleton = ({ children }) => (
    <div ref={hostRef} style={{ width: "100%", height: "100%", minHeight: 320 }}>
      {w === 0 && (
        <div style={{ fontSize: 12, color: AXIS_COLOR, marginBottom: 6 }}>
          (ℹ️ 차트 컨테이너 width=0 — 부모 레이아웃을 확인하세요)
        </div>
      )}
      <ResponsiveContainer>
        {children}
      </ResponsiveContainer>
    </div>
  );

  if (loading) return <div style={{ padding: 12, color: AXIS_COLOR }}>Loading preview…</div>;

  // 에러가 있어도 차트는 그립니다(경고만 표시)
  const Warning = error ? (
    <div
      style={{
        padding: 8, marginBottom: 8, fontSize: 12,
        background: "#fff3cd", border: "1px solid #ffeeba", borderRadius: 6, color: "#92400e"
      }}
    >
      ⚠️ {String(error)}
    </div>
  ) : null;

  switch (chartType) {
    case "LINE_TIME_SERIES":
      return (
        <>
          {Warning}
          <Skeleton>
            <LineChart data={safeRows} margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
              <CartesianGrid stroke={GRID_COLOR} strokeDasharray="3 3" />
              <XAxis dataKey="x" tick={{ fontSize: 12, fill: AXIS_COLOR }} minTickGap={24} tickFormatter={fmtX} stroke={AXIS_COLOR} />
              <YAxis allowDecimals tick={{ fontSize: 12, fill: AXIS_COLOR }} domain={[0, "auto"]} stroke={AXIS_COLOR} />
              <Tooltip
                labelFormatter={fmtX}
                contentStyle={{ background: "#0f172a", border: "1px solid #334155", color: AXIS_COLOR }}
                itemStyle={{ color: AXIS_COLOR }}
                formatter={(val) => [String(val), "Count"]}
              />
              <Line
                type="monotone"
                dataKey="y"
                stroke={LINE_COLOR}
                dot={{ r: 3, stroke: LINE_COLOR }}
                activeDot={{ r: 4 }}
                strokeWidth={2}
                connectNulls
              />
            </LineChart>
          </Skeleton>
        </>
      );

    case "BAR_TIME_SERIES":
    case "VERTICAL_BAR":
      return (
        <>
          {Warning}
          <Skeleton>
            <BarChart data={safeRows} margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
              <CartesianGrid stroke={GRID_COLOR} strokeDasharray="3 3" />
              <XAxis dataKey="x" tick={{ fontSize: 12, fill: AXIS_COLOR }} minTickGap={24} tickFormatter={fmtX} stroke={AXIS_COLOR} />
              <YAxis allowDecimals tick={{ fontSize: 12, fill: AXIS_COLOR }} stroke={AXIS_COLOR} />
              <Tooltip
                labelFormatter={fmtX}
                contentStyle={{ background: "#0f172a", border: "1px solid #334155", color: AXIS_COLOR }}
                itemStyle={{ color: AXIS_COLOR }}
              />
              <Bar dataKey="y" fill={BAR_FILL} />
            </BarChart>
          </Skeleton>
        </>
      );

    case "HORIZONTAL_BAR":
      return (
        <>
          {Warning}
          <Skeleton>
            <BarChart data={safeRows} layout="vertical" margin={{ top: 8, right: 16, bottom: 8, left: 16 }}>
              <CartesianGrid stroke={GRID_COLOR} strokeDasharray="3 3" />
              <XAxis type="number" allowDecimals tick={{ fontSize: 12, fill: AXIS_COLOR }} stroke={AXIS_COLOR} />
              <YAxis type="category" dataKey="x" tick={{ fontSize: 12, fill: AXIS_COLOR }} width={100} stroke={AXIS_COLOR} />
              <Tooltip
                contentStyle={{ background: "#0f172a", border: "1px solid #334155", color: AXIS_COLOR }}
                itemStyle={{ color: AXIS_COLOR }}
              />
              <Bar dataKey="y" fill={BAR_FILL} />
            </BarChart>
          </Skeleton>
        </>
      );

    case "PIE": {
      const pieData =
        rows.length > 0
          ? rows.map((r) => ({ name: r.x, value: Math.max(0, r.y) }))
          : [{ name: "A", value: 1 }, { name: "B", value: 1 }];
      return (
        <>
          {Warning}
          <Skeleton>
            <PieChart>
              <Tooltip
                contentStyle={{ background: "#0f172a", border: "1px solid #334155", color: AXIS_COLOR }}
                itemStyle={{ color: AXIS_COLOR }}
              />
              <Pie data={pieData} dataKey="value" nameKey="name" outerRadius="80%">
                {pieData.map((_, i) => <Cell key={i} fill={PIE_FILLS[i % PIE_FILLS.length]} />)}
              </Pie>
            </PieChart>
          </Skeleton>
        </>
      );
    }

    case "NUMBER": {
      const total = safeRows.reduce((s, r) => s + (r.y || 0), 0);
      return (
        <>
          {Warning}
          <div
            style={{
              minHeight: 320,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 48,
              fontWeight: 700,
              color: AXIS_COLOR,
            }}
          >
            {total}
          </div>
        </>
      );
    }

    case "HISTOGRAM":
    default:
      return (
        <>
          {Warning}
          <Skeleton>
            <LineChart data={safeRows}>
              <CartesianGrid stroke={GRID_COLOR} strokeDasharray="3 3" />
              <XAxis dataKey="x" tick={{ fontSize: 12, fill: AXIS_COLOR }} tickFormatter={fmtX} stroke={AXIS_COLOR} />
              <YAxis tick={{ fontSize: 12, fill: AXIS_COLOR }} stroke={AXIS_COLOR} />
              <Tooltip
                labelFormatter={fmtX}
                contentStyle={{ background: "#0f172a", border: "1px solid #334155", color: AXIS_COLOR }}
                itemStyle={{ color: AXIS_COLOR }}
              />
              <Line type="monotone" dataKey="y" stroke={LINE_COLOR} dot={{ r: 3, stroke: LINE_COLOR }} strokeWidth={2} />
            </LineChart>
          </Skeleton>
        </>
      );
  }
}
