// src/Pages/Widget/components/ChartPreview.jsx
import React, { useMemo } from "react";
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

const AXIS_COLOR = "#E5E7EB";
const GRID_COLOR = "#334155";
const LINE_COLOR = "#22D3EE";
const BAR_FILL = "#60A5FA";
const PIE_FILLS = ["#60A5FA", "#34D399", "#F472B6", "#FBBF24", "#A78BFA", "#F87171"];

// BigNumber 컴포넌트
const BigNumberChart = ({ data }) => {
  const total = data.reduce((sum, item) => {
    const value = item.y ?? item.value ?? item.metric ?? item.count ?? 0;
    return sum + (typeof value === 'number' ? value : 0);
  }, 0);

  const formatNumber = (num) => {
    if (num >= 1e9) return (num / 1e9).toFixed(1) + 'B';
    if (num >= 1e6) return (num / 1e6).toFixed(1) + 'M';
    if (num >= 1e3) return (num / 1e3).toFixed(1) + 'K';
    return num.toLocaleString();
  };

  return (
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
      {formatNumber(total)}
    </div>
  );
};

// PivotTable 컴포넌트
const PivotTableChart = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <div style={{ padding: 12, color: AXIS_COLOR }}>
        데이터가 없습니다
      </div>
    );
  }

  const tableRows = data.map((item, index) => ({
    id: index,
    dimension: item.x ?? item.dimension ?? item.name ?? `Row ${index + 1}`,
    value: item.y ?? item.value ?? item.metric ?? item.count ?? 0
  }));

  return (
    <div style={{ 
      width: "100%", 
      height: "100%", 
      overflow: "auto",
      minHeight: 320,
      padding: "12px"
    }}>
      <table style={{
        width: "100%",
        borderCollapse: "collapse",
        fontSize: "14px"
      }}>
        <thead>
          <tr style={{ borderBottom: `2px solid ${GRID_COLOR}` }}>
            <th style={{
              textAlign: "left",
              padding: "12px 16px",
              color: AXIS_COLOR,
              fontWeight: 600
            }}>
              Dimension
            </th>
            <th style={{
              textAlign: "right",
              padding: "12px 16px",
              color: AXIS_COLOR,
              fontWeight: 600
            }}>
              Count
            </th>
          </tr>
        </thead>
        <tbody>
          {tableRows.map((row) => (
            <tr key={row.id} style={{ 
              borderBottom: `1px solid ${GRID_COLOR}`,
              transition: "background 0.2s"
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = "#1e293b"}
            onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
            >
              <td style={{
                padding: "10px 16px",
                color: AXIS_COLOR
              }}>
                {row.dimension}
              </td>
              <td style={{
                padding: "10px 16px",
                textAlign: "right",
                color: AXIS_COLOR,
                fontFamily: "monospace"
              }}>
                {typeof row.value === 'number' ? row.value.toLocaleString() : row.value}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// Histogram 컴포넌트
const HistogramChart = ({ data }) => {
  // Histogram 데이터 처리 - ClickHouse histogram 형식 지원
  let histogramData = [];
  
  // ClickHouse histogram 형식 체크 (array of tuples)
  if (data.length > 0 && data[0].metric && Array.isArray(data[0].metric)) {
    // [(lower, upper, height), ...] 형식
    histogramData = data[0].metric.map(([lower, upper, height], index) => ({
      bin: `[${lower.toFixed(1)}-${upper.toFixed(1)})`,
      count: height || 0,
      lower,
      upper
    }));
  } else {
    // 일반 데이터 형식
    histogramData = data.map((item, index) => ({
      bin: item.x ?? item.dimension ?? item.bucket ?? `Bin ${index + 1}`,
      count: item.y ?? item.value ?? item.metric ?? item.count ?? 0
    }));
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={histogramData} margin={{ top: 8, right: 16, bottom: 60, left: 0 }}>
        <CartesianGrid stroke={GRID_COLOR} strokeDasharray="3 3" />
        <XAxis 
          dataKey="bin" 
          tick={{ fontSize: 12, fill: AXIS_COLOR }} 
          stroke={AXIS_COLOR}
          angle={-45}
          textAnchor="end"
          height={80}
        />
        <YAxis 
          tick={{ fontSize: 12, fill: AXIS_COLOR }} 
          stroke={AXIS_COLOR} 
        />
        <Tooltip
          contentStyle={{ 
            background: "#0f172a", 
            border: `1px solid ${GRID_COLOR}`, 
            color: AXIS_COLOR 
          }}
        />
        <Bar dataKey="count" fill={BAR_FILL} />
      </BarChart>
    </ResponsiveContainer>
  );
};

export default function ChartPreview({
  chartType = "LINE_TIME_SERIES",
  data = [],
  chartConfig = {},
  loading = false,
  error = "",
}) {
  // 데이터 표준화
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

  // 빈 데이터 처리
  const safeRows = useMemo(() => {
    if (rows.length) return rows;
    return [{ x: "No Data", y: 0 }];
  }, [rows]);

  // 시간 포맷터
  const fmtX = (v) => {
    const d = new Date(v);
    if (isNaN(d)) return String(v);
    return d.toLocaleString("ko-KR", {
      month: "numeric",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div style={{ 
        padding: 12, 
        color: AXIS_COLOR,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        height: "100%"
      }}>
        <div style={{ textAlign: "center" }}>
          <div style={{
            width: 40,
            height: 40,
            border: `3px solid ${GRID_COLOR}`,
            borderTopColor: LINE_COLOR,
            borderRadius: "50%",
            animation: "spin 1s linear infinite",
            margin: "0 auto 12px"
          }}></div>
          차트 로딩 중...
        </div>
        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  // 에러 표시
  const Warning = error ? (
    <div
      style={{
        padding: 8,
        marginBottom: 8,
        fontSize: 12,
        background: "#7f1d1d",
        border: "1px solid #991b1b",
        borderRadius: 6,
        color: "#fca5a5",
      }}
    >
      ⚠️ {String(error)}
    </div>
  ) : null;

  // 차트 타입별 렌더링
  switch (chartType) {
    case "PIVOT_TABLE":
      return (
        <>
          {Warning}
          <PivotTableChart data={safeRows} />
        </>
      );

    case "NUMBER":
      return (
        <>
          {Warning}
          <BigNumberChart data={safeRows} />
        </>
      );

    case "HISTOGRAM":
      return (
        <>
          {Warning}
          <HistogramChart data={safeRows} />
        </>
      );

    case "LINE_TIME_SERIES":
      return (
        <>
          {Warning}
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={safeRows} margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
              <CartesianGrid stroke={GRID_COLOR} strokeDasharray="3 3" />
              <XAxis 
                dataKey="x" 
                tick={{ fontSize: 12, fill: AXIS_COLOR }} 
                minTickGap={24} 
                tickFormatter={fmtX} 
                stroke={AXIS_COLOR} 
              />
              <YAxis 
                tick={{ fontSize: 12, fill: AXIS_COLOR }} 
                domain={[0, "auto"]} 
                stroke={AXIS_COLOR} 
              />
              <Tooltip
                labelFormatter={fmtX}
                contentStyle={{ 
                  background: "#0f172a", 
                  border: `1px solid ${GRID_COLOR}`, 
                  color: AXIS_COLOR 
                }}
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
          </ResponsiveContainer>
        </>
      );

    case "BAR_TIME_SERIES":
    case "VERTICAL_BAR":
      return (
        <>
          {Warning}
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={safeRows} margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
              <CartesianGrid stroke={GRID_COLOR} strokeDasharray="3 3" />
              <XAxis 
                dataKey="x" 
                tick={{ fontSize: 12, fill: AXIS_COLOR }} 
                minTickGap={24} 
                tickFormatter={fmtX} 
                stroke={AXIS_COLOR} 
              />
              <YAxis 
                tick={{ fontSize: 12, fill: AXIS_COLOR }} 
                stroke={AXIS_COLOR} 
              />
              <Tooltip
                labelFormatter={fmtX}
                contentStyle={{ 
                  background: "#0f172a", 
                  border: `1px solid ${GRID_COLOR}`, 
                  color: AXIS_COLOR 
                }}
              />
              <Bar dataKey="y" fill={BAR_FILL} />
            </BarChart>
          </ResponsiveContainer>
        </>
      );

    case "HORIZONTAL_BAR":
      return (
        <>
          {Warning}
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={safeRows} layout="horizontal" margin={{ top: 8, right: 16, bottom: 8, left: 80 }}>
              <CartesianGrid stroke={GRID_COLOR} strokeDasharray="3 3" />
              <XAxis type="number" tick={{ fontSize: 12, fill: AXIS_COLOR }} stroke={AXIS_COLOR} />
              <YAxis 
                type="category" 
                dataKey="x" 
                tick={{ fontSize: 12, fill: AXIS_COLOR }} 
                width={70} 
                stroke={AXIS_COLOR} 
              />
              <Tooltip
                contentStyle={{ 
                  background: "#0f172a", 
                  border: `1px solid ${GRID_COLOR}`, 
                  color: AXIS_COLOR 
                }}
              />
              <Bar dataKey="y" fill={BAR_FILL} />
            </BarChart>
          </ResponsiveContainer>
        </>
      );

    case "PIE": {
      const pieData = rows.length > 0
        ? rows.map((r) => ({ name: r.x, value: Math.max(0, r.y) }))
        : [{ name: "A", value: 1 }, { name: "B", value: 1 }];
      
      return (
        <>
          {Warning}
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Tooltip
                contentStyle={{ 
                  background: "#0f172a", 
                  border: `1px solid ${GRID_COLOR}`, 
                  color: AXIS_COLOR 
                }}
              />
              <Pie 
                data={pieData} 
                dataKey="value" 
                nameKey="name" 
                cx="50%"
                cy="50%"
                outerRadius="80%"
              >
                {pieData.map((_, i) => (
                  <Cell key={i} fill={PIE_FILLS[i % PIE_FILLS.length]} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </>
      );
    }

    default:
      return (
        <>
          {Warning}
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={safeRows}>
              <CartesianGrid stroke={GRID_COLOR} strokeDasharray="3 3" />
              <XAxis dataKey="x" tick={{ fontSize: 12, fill: AXIS_COLOR }} tickFormatter={fmtX} stroke={AXIS_COLOR} />
              <YAxis tick={{ fontSize: 12, fill: AXIS_COLOR }} stroke={AXIS_COLOR} />
              <Tooltip
                labelFormatter={fmtX}
                contentStyle={{ 
                  background: "#0f172a", 
                  border: `1px solid ${GRID_COLOR}`, 
                  color: AXIS_COLOR 
                }}
              />
              <Line type="monotone" dataKey="y" stroke={LINE_COLOR} dot={{ r: 3, stroke: LINE_COLOR }} strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </>
      );
  }
}