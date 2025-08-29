// src/Pages/Widget/services/filters.js
import { ApiClient } from "./apiClient.js";

const PRESET_TRACES = [
  { id: "environment", name: "Environment", type: "stringOptions" },
  { id: "traceName", name: "Trace Name", type: "string" },
  { id: "observationName", name: "Observation Name", type: "string" },
  { id: "scoreName", name: "Score Name", type: "string" },
  { id: "tags", name: "Tags", type: "arrayOptions" },
  { id: "user", name: "User", type: "stringOptions" },
  { id: "session", name: "Session", type: "stringOptions" },
  { id: "metadata", name: "Metadata", type: "string" },
  { id: "release", name: "Release", type: "stringOptions" },
  { id: "version", name: "Version", type: "stringOptions" },
];

const PRESET_OBSERVATIONS = [
  ...PRESET_TRACES,
  { id: "modelName", name: "Model Name", type: "stringOptions" },
  { id: "inputTokens", name: "Input Tokens", type: "number" },
  { id: "outputTokens", name: "Output Tokens", type: "number" },
];

const PRESET_SCORES = [
  ...PRESET_TRACES,
  { id: "scoreValue", name: "Score Value", type: "number" },
  { id: "scoreSource", name: "Score Source", type: "stringOptions" },
];

const PRESETS = {
  traces: PRESET_TRACES,
  observations: PRESET_OBSERVATIONS,
  scores: PRESET_SCORES,
};

async function fetchDistinctValues(
  api,
  { view, column, search = "", limit = 50 }
) {
  const attempts = [
    {
      ep: "dashboard.distinctValues",
      body: { projectId: api.projectId, view, column, search, limit },
    },
    {
      ep: "dashboard.columnOptions",
      body: { projectId: api.projectId, view, column, limit },
    },
    {
      ep: "query.distinctValues",
      body: { projectId: api.projectId, view, field: column, search, limit },
    },
  ];

  for (const { ep, body } of attempts) {
    try {
      const raw = await api.trpcGet(ep, body);
      let vals = raw?.values ?? raw?.items ?? raw;

      if (Array.isArray(vals)) {
        vals = vals
          .map((v) =>
            typeof v === "object" ? v.value ?? v.name ?? v.label : v
          )
          .filter((v) => v != null && v !== "");

        if (search) {
          const s = search.toLowerCase();
          vals = vals.filter((v) => String(v).toLowerCase().includes(s));
        }

        return [...new Set(vals)].slice(0, limit);
      }
    } catch (error) {
      console.warn(`Failed to fetch from ${ep}:`, error);
    }
  }

  // Fallback: try to get data via executeQuery
  try {
    const from = new Date(Date.now() - 30 * 86400000).toISOString();
    const to = new Date().toISOString();

    const data = await api.trpcGet("dashboard.executeQuery", {
      projectId: api.projectId,
      query: {
        view,
        dimensions: [{ field: column }],
        metrics: [{ measure: "count", aggregation: "count" }],
        filters: search
          ? [{ column, operator: "CONTAINS", value: search }]
          : [],
        timeDimension: { granularity: "auto" },
        fromTimestamp: from,
        toTimestamp: to,
        chartConfig: { type: "PIVOT_TABLE" },
        orderBy: [{ column: "count", order: "DESC" }],
      },
    });

    const rows = data?.rows ?? data?.items ?? data?.data ?? [];
    let vals = Array.isArray(rows)
      ? rows.map((r) => r?.[column] ?? r?.value ?? r?.name).filter(Boolean)
      : [];

    vals = [...new Set(vals)];

    if (search) {
      const s = search.toLowerCase();
      vals = vals.filter((v) => String(v).toLowerCase().includes(s));
    }

    return vals.slice(0, limit);
  } catch (error) {
    console.warn("Fallback query failed:", error);
    return [];
  }
}

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

  async getFilterValues({ view = "traces", column, search = "", limit = 50 }) {
    if (!column) return [];
    return fetchDistinctValues(this, { view, column, search, limit });
  }

  serializeFilters(filters = [], columns = []) {
    if (!Array.isArray(filters)) return [];

    const colMeta = Object.fromEntries(
      (columns || []).map((c) => [c.id || c.column || c.name, c])
    );

    return filters
      .map((f) => {
        const column = f.column || f.id || f.field || f.columnId || f.name;
        const opKey = (f.operator || f.op || "").toString().toLowerCase();
        const operator = OP_MAP[opKey] || OP_MAP.contains;

        let value =
          f.values ?? f.value ?? f.val ?? (f.list ? [...f.list] : undefined);

        if (
          (operator === "IN" || operator === "NOT_IN") &&
          typeof value === "string"
        ) {
          value = value
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean);
        }

        const type = colMeta[column]?.type || "string";
        if (type === "arrayOptions" && !Array.isArray(value)) {
          value = value != null ? [value] : [];
        }

        return { column, operator, value };
      })
      .filter((f) => f.column && f.operator);
  }
}
