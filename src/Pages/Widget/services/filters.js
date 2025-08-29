// src/Pages/Widget/services/filters.js
import { ApiClient } from "./apiClient.js";
import { fetchMetrics, toISO, autoGranularity } from "./metricsApi.js";

/* ── (1) 프리셋: 서버 스키마 키에 맞춤 (userId/sessionId) ─────────────────── */
const PRESET_TRACES = [
  { id: "environment",   name: "Environment",     type: "stringOptions" },
  { id: "name",          name: "Trace Name",      type: "string" },
  { id: "observationName", name: "Observation Name", type: "string" },
  { id: "scoreName",     name: "Score Name",      type: "string" },
  { id: "tags",          name: "Tags",            type: "arrayOptions" },
  { id: "userId",        name: "User",            type: "stringOptions" },
  { id: "sessionId",     name: "Session",         type: "stringOptions" },
  { id: "metadata",      name: "Metadata",        type: "string" },
  { id: "release",       name: "Release",         type: "stringOptions" },
  { id: "version",       name: "Version",         type: "stringOptions" },
];

const PRESETS = {
  traces: PRESET_TRACES,
  observations: [
    { id: "name",        name: "Name",    type: "string" },
    { id: "type",        name: "Type",    type: "stringOptions" },
    { id: "model",       name: "Model",   type: "stringOptions" },
    { id: "environment", name: "Environment", type: "stringOptions" },
  ],
  scores: [
    { id: "name",   name: "Score Name",  type: "string" },
    { id: "value",  name: "Value",       type: "number" },
    { id: "source", name: "Source",      type: "stringOptions" },
  ],
};

/* ── (2) 별칭 교정: UI/타 페이지에서 들어오는 구(old) 키를 서버 키로 ──────── */
const DIMENSION_ALIAS = {
  user: "userId",
  session: "sessionId",
  traceName: "name",
};
const normalizeField = (col) => DIMENSION_ALIAS[col] ?? col;

/* ── (3) 서버가 제공하는 전용 옵션 먼저 시도 ────────────────────────────── */
async function fetchServerProvidedOptions(api, view, field) {
  const f = normalizeField(field);

  // 환경 옵션 (200 OK 확인된 라우트)
  if (f === "environment") {
    try {
      const res = await api.trpcGet("projects.environmentFilterOptions", {});
      return Array.isArray(res) ? res : null;
    } catch {
      /* noop */
    }
  }

  // traces.filterOptions 결과에서 매핑
  if (view === "traces") {
    try {
      const res = await api.trpcGet("traces.filterOptions", {});
      if (f === "tags"      && Array.isArray(res?.tags))      return res.tags;
      if (f === "userId"    && Array.isArray(res?.users))     return res.users;
      if (f === "sessionId" && Array.isArray(res?.sessions))  return res.sessions;
      if (f === "release"   && Array.isArray(res?.releases))  return res.releases;
      if (f === "version"   && Array.isArray(res?.versions))  return res.versions;
    } catch {
      /* noop */
    }
  }

  return null;
}

/* ── (4) Distinct 값: Metrics API 우선, 실패시 dashboard.executeQuery ─────── */
async function fetchDistinctValues(
  api,
  { view, column, search = "", limit = 50, from, to }
) {
  const dimField = normalizeField(column);

  // 4-1) 서버 전용 옵션 우선
  const serverVals = await fetchServerProvidedOptions(api, view, dimField);
  if (serverVals) {
    const arr = serverVals.map((v) => String(v)).filter(Boolean);
    return search
      ? arr
          .filter((v) => v.toLowerCase().includes(search.toLowerCase()))
          .slice(0, limit)
      : arr.slice(0, limit);
  }

  // 4-2) Metrics API 시도 (가벼운 집계) – 서버 스키마 불확실한 검색 필터는 제거
  try {
    const fromISO = toISO(from || new Date(Date.now() - 7 * 86400000));
    const toISO_ = toISO(to || new Date());
    const gran = autoGranularity(fromISO, toISO_);

    const params = {
      view,
      metrics: [{ measure: "count", aggregation: "count" }], // id 키 불필요
      dimensions: [{ field: dimField }],
      filters: [],
      timeDimension: { granularity: gran },
      fromTimestamp: fromISO,
      toTimestamp: toISO_,
      limit,
    };

    const json = await fetchMetrics(params);
    const rows = Array.isArray(json?.data) ? json.data : [];

    const pickLabel = (row) =>
      row?.[dimField] ??
      row?.[column] ??
      row?.dimension ??
      row?.name ??
      Object.values(row).find((v) => typeof v === "string") ??
      "";

    let values = rows.map(pickLabel).filter(Boolean).map(String);
    values = [...new Set(values)];
    if (search)
      values = values.filter((v) =>
        v.toLowerCase().includes(search.toLowerCase())
      );
    return values.slice(0, limit);
  } catch (err) {
    console.warn(
      "Metrics API failed, fallback to executeQuery:",
      err?.message || err
    );
  }

  // 4-3) tRPC dashboard.executeQuery – 배열 필드(tags)는 여기서 스킵
  if (dimField === "tags") return [];

  try {
    const fromISO = toISO(from || new Date(Date.now() - 30 * 86400000));
    const toISO_ = toISO(to || new Date());

    const data = await api.trpcGet("dashboard.executeQuery", {
      query: {
        view,
        dimensions: [{ field: dimField }],
        metrics: [{ measure: "count", aggregation: "count" }],
        filters: [], // 검색 필터 제거(불확실한 스키마로 400 방지)
        timeDimension: { granularity: "auto" },
        fromTimestamp: fromISO,
        toTimestamp: toISO_,
      },
    });

    const raw =
      data?.chartData ||
      data?.data ||
      data?.series ||
      data?.results ||
      data?.rows ||
      data?.items ||
      [];

    let vals = Array.isArray(raw)
      ? raw
          .map((r, i) =>
            Array.isArray(r)
              ? r[0]
              : r?.x ?? r?.name ?? r?.[dimField] ?? r?.[column] ?? `Row ${i + 1}`
          )
          .filter(Boolean)
      : [];

    vals = [...new Set(vals.map(String))];
    if (search)
      vals = vals.filter((v) =>
        v.toLowerCase().includes(search.toLowerCase())
      );
    return vals.slice(0, limit);
  } catch (error) {
    console.warn("Fallback executeQuery failed:", error);
    return [];
  }
}

/* ── (5) 연산자 매핑: 서버 기대값(대문자/스네이크)로 통일 ─────────────────── */
const OP_MAP = {
  is: "=",
  "=": "=",
  "is equal to": "=",
  "is not": "!=",
  "!=": "!=",
  contains: "CONTAINS",
  "does not contain": "NOT_CONTAINS",
  in: "IN",
  "not in": "NOT_IN",
  ">": ">",
  "<": "<",
  ">=": ">=",
  "<=": "<=",
};

export class FiltersAPI extends ApiClient {
  async getFilterColumns(view = "traces") {
    const columns = PRESETS[view] || PRESETS.traces;
    return { success: true, data: columns };
  }

  async getOptions(view = "traces", { searchByColumn = {}, limit = 50 } = {}) {
    const preset = PRESETS[view] || PRESETS.traces;
    const optionColumns = preset.filter((c) =>
      ["stringOptions", "arrayOptions", "categoryOptions"].includes(c.type)
    );

    const entries = await Promise.all(
      optionColumns.map(async (col) => {
        const search = searchByColumn[col.id] ?? "";
        const list = await fetchDistinctValues(this, {
          view,
          column: col.id,
          search,
          limit,
        });
        const options = list.map((v) => ({ value: String(v) }));
        return [col.id, options];
      })
    );

    return Object.fromEntries(entries);
  }

  async getFilterValues({
    view = "traces",
    column,
    search = "",
    limit = 50,
  }) {
    if (!column) return [];
    return fetchDistinctValues(this, { view, column, search, limit });
  }

  serializeFilters(filters = [], columns = []) {
    if (!Array.isArray(filters)) return [];

    const colMeta = Object.fromEntries(
      (columns || []).map((c) => [c.id || c.column || c.name, c])
    );

    const out = filters
      .map((f) => {
        const rawCol = f.column || f.id || f.field || f.columnId || f.name;
        const column = normalizeField(rawCol);
        const opKey = (f.operator || f.op || "").toString().toLowerCase();
        const operator = OP_MAP[opKey] || "CONTAINS";

        let value =
          f.values ?? f.value ?? f.val ?? (f.list ? [...f.list] : undefined);

        // IN/NOT_IN 문자열 -> 배열 분리
        if (
          (operator === "IN" || operator === "NOT_IN") &&
          typeof value === "string"
        ) {
          value = value
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean);
        }

        const type = colMeta[rawCol]?.type || "string";
        if (type === "arrayOptions" && !Array.isArray(value)) {
          value = value != null ? [value] : [];
        }

        // 빈 값 제거 ("", [], null, undefined)
        const isEmpty =
          value == null ||
          (typeof value === "string" && value.trim() === "") ||
          (Array.isArray(value) && value.length === 0);
        if (isEmpty) return null;

        return { column, operator, value };
      })
      .filter((f) => f && f.column && f.operator);

    // 중복 제거(안전)
    const seen = new Set();
    return out.filter((f) => {
      const key = JSON.stringify(f);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }
}
