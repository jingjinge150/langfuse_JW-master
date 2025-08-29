// src/Pages/Widget/services/widgetAPI.js

const CONFIG = {
  BASE_URL: "", // Vite proxy 사용: /api -> Langfuse (target: http://localhost:3000)
  PROJECT_ID: import.meta.env.VITE_LANGFUSE_PROJECT_ID,
};

const DEBUG = import.meta.env.DEV;

function assertEnv() {
  const missing = [];
  if (!CONFIG.PROJECT_ID) missing.push("VITE_LANGFUSE_PROJECT_ID");
  if (missing.length) {
    const msg = `필수 환경변수 누락: ${missing.join(", ")}`;
    console.error(msg);
    throw new Error(msg);
  }
}

// ---- 필터 전용 매핑/캐시 ----
const TYPE_MAP = {
  string: "string",
  number: "number",
  boolean: "boolean",
  datetime: "datetime",
  enum: "stringOptions",
  stringOptions: "stringOptions",
};
const __columnsCache = new Map();
const __optionsCache = new Map();

class WidgetAPI {
  constructor() {
    assertEnv();
    this.baseURL = CONFIG.BASE_URL;
    this.projectId = CONFIG.PROJECT_ID;
    if (DEBUG) console.log("[widgetAPI] build v3", new Date().toISOString());
  }

  getHeaders() {
    return {
      "Content-Type": "application/json",
      Accept: "application/json",
    };
  }

  // ---------------- tRPC helpers ----------------
  async trpcGet(endpoint, payload = null) {
    const params = new URLSearchParams({
      input: JSON.stringify({ json: payload }),
    });
    const url = `${this.baseURL}/api/trpc/${endpoint}?${params.toString()}`;
    if (DEBUG) console.log("tRPC GET:", { url, payload });

    try {
      const res = await fetch(url, {
        method: "GET",
        headers: this.getHeaders(),
      });
      const text = await res.text();
      if (DEBUG)
        console.log("tRPC GET resp:", {
          status: res.status,
          bodyPreview: text.slice(0, 200),
        });

      let data;
      try {
        data = JSON.parse(text);
      } catch (e) {
        console.error("JSON 파싱 실패:", text.slice(0, 400));
        throw new Error(`JSON 파싱 실패: ${e.message}`);
      }
      if (!res.ok) {
        const msg =
          data?.error?.json?.message ||
          data?.error?.message ||
          `HTTP ${res.status}`;
        throw new Error(`API 에러 (${res.status}): ${msg}`);
      }
      return data?.result?.data?.json ?? data?.result?.data ?? data;
    } catch (e) {
      if (DEBUG)
        console.error("tRPC GET 실패:", {
          endpoint,
          url,
          error: e.message || e,
        });
      throw new Error(`API 에러 (${e.message || "Failed to fetch"})`);
    }
  }

  async trpcPost(endpoint, payload = null) {
    const url = `${this.baseURL}/api/trpc/${endpoint}`;
    if (DEBUG) console.log("tRPC POST:", { url, payload });

    try {
      const res = await fetch(url, {
        method: "POST",
        headers: this.getHeaders(),
        body: JSON.stringify({ json: payload }),
      });
      const text = await res.text();
      if (DEBUG)
        console.log("tRPC POST resp:", {
          status: res.status,
          bodyPreview: text.slice(0, 200),
        });

      let data;
      try {
        data = JSON.parse(text);
      } catch (e) {
        console.error("JSON 파싱 실패:", text.slice(0, 400));
        throw new Error(`JSON 파싱 실패: ${e.message}`);
      }
      if (!res.ok) {
        const msg =
          data?.error?.json?.message ||
          data?.error?.message ||
          `HTTP ${res.status}`;
        throw new Error(`API 에러 (${res.status}): ${msg}`);
      }
      return data?.result?.data?.json ?? data?.result?.data ?? data;
    } catch (e) {
      if (DEBUG)
        console.error("tRPC POST 실패:", {
          endpoint,
          url,
          error: e.message || e,
        });
      throw new Error(`API 에러 (${e.message || "Failed to fetch"})`);
    }
  }

  // ---------------- 연결 체크 (실제 200 확인된 tRPC로 GET) ----------------
  async testConnection() {
    try {
      const params = new URLSearchParams({
        input: JSON.stringify({
          json: {
            page: 0,
            limit: 1,
            projectId: this.projectId,
            orderBy: { column: "updatedAt", order: "DESC" },
          },
        }),
      });
      const url = `${
        this.baseURL
      }/api/trpc/dashboard.allDashboards?${params.toString()}`;
      const r = await fetch(url, { method: "GET", headers: this.getHeaders() });
      if (r.ok) return { success: true };
    } catch {}

    try {
      const params = new URLSearchParams({
        input: JSON.stringify({
          json: {
            page: 0,
            limit: 1,
            projectId: this.projectId,
            orderBy: { column: "updatedAt", order: "DESC" },
          },
        }),
      });
      const url = `${
        this.baseURL
      }/api/trpc/dashboardWidgets.all?${params.toString()}`;
      const r = await fetch(url, { method: "GET", headers: this.getHeaders() });
      if (r.ok) return { success: true };
    } catch {}

    return { success: false, message: "Langfuse 연결 실패 (tRPC)" };
  }

  // ---------------- 위젯 목록 (확장 파서 + projectId 제거 재시도) ----------------
  async getWidgets(page = 1, pageSize = 50, order = "DESC") {
    const payloadBase = {
      page: Math.max(0, Number(page) - 1), // 0-based
      limit: Number(pageSize),
      orderBy: { column: "updatedAt", order },
    };

    let data = await this.trpcGet("dashboardWidgets.all", {
      ...payloadBase,
      projectId: this.projectId,
    });

    const extractItems = (d) => {
      if (!d) return [];
      let arr = d.items || d.data || d.widgets;
      if (Array.isArray(d)) arr = d;
      if (!arr && Array.isArray(d.edges)) arr = d.edges.map((e) => e.node);
      if (!arr && Array.isArray(d.rows)) arr = d.rows;
      return Array.isArray(arr) ? arr : [];
    };

    let items = extractItems(data);

    if (!items.length) {
      if (DEBUG)
        console.warn(
          "[getWidgets] empty with projectId, retry without projectId"
        );
      data = await this.trpcGet("dashboardWidgets.all", { ...payloadBase });
      items = extractItems(data);
    }

    if (DEBUG) {
      console.log("[getWidgets] raw:", data);
      console.log(
        "[getWidgets] count:",
        items.length,
        "first keys:",
        items[0] ? Object.keys(items[0]) : "no items"
      );
    }

    const total = data?.total ?? data?.totalItems ?? items.length;
    const totalPages = Math.max(
      1,
      Math.ceil((total || 1) / (payloadBase.limit || 1))
    );
    return { data: items, totalPages };
  }

  // ---------------- 위젯 삭제 ----------------
  async deleteWidget(id) {
    if (!id) return { success: false, error: "id 필요" };
    try {
      await this.trpcPost("dashboardWidgets.delete", {
        projectId: this.projectId,
        id,
      });
      return { success: true };
    } catch (e) {
      if (DEBUG) console.warn("[deleteWidget] 실패:", e.message);
      return { success: false, error: e.message || "삭제 실패" };
    }
  }

  // ---------------- 쿼리 실행 ----------------
  async executeQuery(
    {
      view = "traces",
      dimensions = [],
      metrics = [{ measure: "count", aggregation: "count" }],
      filters = [],
      fromTimestamp,
      toTimestamp,
      chartType = "LINE_TIME_SERIES",
      timeDimension = null,
      orderBy = [],
    },
    columns = []
  ) {
    const normalizedMetrics = (metrics || []).map((m) => ({
      measure: m?.measure ?? m?.columnId ?? "count",
      aggregation: m?.aggregation ?? m?.agg ?? "count",
    }));

    const mapped = this.mapColumnNameToId(filters, columns);
    const cleanFilters = this.sanitizeFilters(mapped, columns);

    const payload = {
      projectId: this.projectId,
      query: {
        view,
        dimensions,
        metrics: normalizedMetrics,
        filters: cleanFilters,
        timeDimension: timeDimension || { granularity: "day" },
        fromTimestamp:
          fromTimestamp || new Date(Date.now() - 7 * 86400000).toISOString(),
        toTimestamp: toTimestamp || new Date().toISOString(),
        chartConfig: this.buildChartConfig(chartType),
        orderBy: Array.isArray(orderBy) ? orderBy : [],
      },
    };

    const data = await this.trpcGet("dashboard.executeQuery", payload);

    const chartDataRaw = data?.chartData || data?.data || data?.series || [];
    const chartData = Array.isArray(chartDataRaw)
      ? chartDataRaw
          .map((p) => {
            if (Array.isArray(p)) return { x: p[0], y: Number(p[1]) || 0 };
            const x = p.time || p.timestamp || p.date || p.bucket || p.x;
            const y = Number(p.value ?? p.y ?? p.count ?? p.total ?? 0);
            return x ? { x, y } : null;
          })
          .filter(Boolean)
      : [];
    const value =
      typeof data?.value === "number"
        ? data.value
        : chartData.reduce((s, d) => s + (d?.y || 0), 0);

    return { success: true, data: { value, chartType, chartData } };
  }

  // ---------------- 프리뷰 유틸 ----------------
  async getMetricsPreview(
    {
      view = "traces",
      from,
      to,
      metric = "count",
      aggregation = "count",
      interval = "day",
      timeDimension = null,
      filters = [],
    },
    columns = []
  ) {
    try {
      const res = await this.executeQuery(
        {
          view,
          dimensions: [],
          metrics: [{ measure: metric, aggregation }],
          filters,
          fromTimestamp: from,
          toTimestamp: to,
          chartType: "LINE_TIME_SERIES",
          timeDimension: timeDimension || { granularity: interval },
        },
        columns
      );
      return {
        count: res?.data?.value || 0,
        chartData: res?.data?.chartData || [],
      };
    } catch (e) {
      if (DEBUG) console.error("메트릭 프리뷰 실패:", e.message);
      return { count: 0, chartData: [] };
    }
  }

  // ---------------- 실제 컬럼 목록 가져오기 (개선: 여러 소스 합쳐서) ----------------
  async getFilterColumns(view = "traces") {
    const cacheKey = `cols:${view}`;
    if (__columnsCache.has(cacheKey))
      return { success: true, data: __columnsCache.get(cacheKey) };

    const payloadBase = { projectId: this.projectId, view };

    const epGroups = [
      [
        "dashboard.availableColumns",
        "dashboard.availableFilters",
        "dashboard.columns",
        "dashboard.schema",
      ],
      [
        "dashboard.traces.columns",
        "dashboard.observations.columns",
        "dashboard.scores.columns",
      ],
      [
        "dashboard.tags.columns",
        "dashboard.metadata.columns",
        "dashboard.session.columns",
        "dashboard.release.columns",
        "dashboard.version.columns",
      ],
    ];

    const gather = async (endpoints, extraPayload = {}) => {
      const out = [];
      for (const ep of endpoints) {
        try {
          const raw = await this.trpcGet(ep, {
            ...payloadBase,
            ...extraPayload,
          });
          const rows =
            raw?.columns ||
            raw?.items ||
            raw?.data ||
            (Array.isArray(raw) ? raw : []) ||
            [];
          out.push(...rows);
        } catch (e) {
          if (DEBUG) console.warn(`[getFilterColumns] ${ep} 실패`, e.message);
        }
      }
      return out;
    };

    let collected = [];
    for (const group of epGroups) {
      const rows = await gather(group, {
        includeDerived: true,
        includeHidden: false,
        includeMeta: true,
      });
      collected.push(...rows);
    }

    const norm = (c) => {
      const id =
        c?.id ?? c?.key ?? c?.columnId ?? c?.field ?? c?.name ?? c?.slug;
      const name = c?.name ?? c?.label ?? c?.title ?? c?.displayName ?? id;
      const typeRaw =
        c?.type ?? c?.kind ?? c?.valueType ?? c?.datatype ?? "string";
      const type = TYPE_MAP[typeRaw] || "string";
      const options = c?.options ?? c?.values ?? c?.enum ?? null;
      if (!id || !name) return null;
      return { id, name, type, ...(options ? { options } : {}) };
    };

    let normalized = collected.map(norm).filter(Boolean);

    // 중복 제거
    const seen = new Set();
    normalized = normalized.filter((c) =>
      seen.has(c.id) ? false : (seen.add(c.id), true)
    );

    // 스크린샷에 있는 파생/그룹 컬럼 보강
    const ensure = (id, name, type = "string") => {
      if (!normalized.find((c) => c.id === id))
        normalized.push({ id, name, type });
    };
    ensure("environment", "Environment", "stringOptions");
    ensure("traceName", "Trace Name");
    ensure("observationName", "Observation Name");
    ensure("scoreName", "Score Name");
    ensure("tags", "Tags", "stringOptions");
    ensure("user", "User");
    ensure("session", "Session");
    ensure("metadata", "Metadata");
    ensure("release", "Release");
    ensure("version", "Version");
    ensure("latency", "Latency", "number");
    ensure("total_cost", "Total Cost", "number");
    ensure("timestamp", "Timestamp", "datetime");

    __columnsCache.set(cacheKey, normalized);
    if (DEBUG) console.log("[getFilterColumns] total:", normalized.length);
    return { success: true, data: normalized };
  }

  // ---------------- 특정 컬럼 값 옵션 가져오기 (값 드롭다운용) ----------------
  async getColumnOptions(view = "traces", columnId, limit = 100) {
    if (!columnId) return { success: true, data: [] };

    const cacheKey = `opts:${view}:${columnId}:${limit}`;
    if (__optionsCache.has(cacheKey))
      return { success: true, data: __optionsCache.get(cacheKey) };

    const payload = {
      projectId: this.projectId,
      view,
      column: columnId,
      limit,
    };

    const endpoints = ["dashboard.distinctValues", "dashboard.columnOptions"];

    for (const ep of endpoints) {
      try {
        const raw = await this.trpcGet(ep, payload);
        let values =
          raw?.values ||
          raw?.items ||
          raw?.data ||
          (Array.isArray(raw) ? raw : []) ||
          [];
        if (values.length && typeof values[0] === "object") {
          values = values
            .map((v) => v?.value ?? v?.name ?? v?.label)
            .filter((v) => v != null);
        }
        const unique = [...new Set(values)].slice(0, limit);
        __optionsCache.set(cacheKey, unique);
        if (DEBUG) console.log("[getColumnOptions]", columnId, unique.length);
        return { success: true, data: unique };
      } catch (e) {
        if (DEBUG) console.warn(`[getColumnOptions] ${ep} 실패`, e.message);
      }
    }

    return { success: true, data: [] };
  }

  // ---------------- 기타 유틸 ----------------
  toAPIChartType(type) {
    const map = {
      line: "LINE_TIME_SERIES",
      "vertical-bar": "BAR_TIME_SERIES",
      bar: "VERTICAL_BAR",
      number: "NUMBER",
      "horizontal-bar": "HORIZONTAL_BAR",
      "vertical-bar-total": "VERTICAL_BAR",
      histogram: "HISTOGRAM",
      pie: "PIE",
      table: "PIVOT_TABLE",
    };
    return map[type] || "NUMBER";
  }

  buildChartConfig(chartType) {
    return { type: this.toAPIChartType(chartType) };
  }

  mapColumnNameToId(filters, columns) {
    const byName = new Map(columns.map((c) => [c.name, c.id]));
    return (filters || []).map((f) => {
      const id = byName.get(f.column) || f.column;
      return { ...f, column: id };
    });
  }

  sanitizeFilters(filters = [], columns = []) {
    const byId = new Map(columns.map((c) => [c.id, c]));
    return filters
      .filter((f) => f?.column && f?.operator !== undefined)
      .map((f) => {
        const col = byId.get(f.column) || {};
        const needsValue = !["exists", "notExists"].includes(f.operator);
        const hasValue =
          f.type === "boolean"
            ? typeof f.value === "boolean"
            : f.type === "number" || f.type === "numberObject"
            ? f.value !== "" &&
              f.value !== null &&
              !Number.isNaN(Number(f.value))
            : Array.isArray(f.value)
            ? f.value.length > 0
            : f.value !== "" && f.value !== undefined && f.value !== null;

        if (needsValue && !hasValue) return null;
        return f;
      })
      .filter(Boolean);
  }
}

// ✅ 반드시 인스턴스를 기본 내보내기
export default new WidgetAPI();
