// src/Pages/Widget/services/metricsApi.js
// ⚠️ 개발용: 브라우저에 secretKey가 노출됩니다. 운영은 서버 프록시 권장!

const publicKey = import.meta.env.VITE_LANGFUSE_PUBLIC_KEY;
const secretKey = import.meta.env.VITE_LANGFUSE_SECRET_KEY;
const baseUrl = import.meta.env.VITE_LANGFUSE_BASE_URL; // ex) http://localhost:3000

if (!publicKey || !secretKey || !baseUrl) {
  console.error("[metricsApi] .env의 VITE_LANGFUSE_* 변수가 비었습니다.");
}

const OP_MAP = {
  is: "=",
  "is equal to": "=",
  "=": "=",
  "is not": "!=",
  "!=": "!=",
  contains: "contains",
  "does not contain": "not in",
  in: "in",
  "not in": "not in",
  ">": ">",
  "<": "<",
  ">=": ">=",
  "<=": "<=",
};

export function toISO(d) {
  try {
    const x = d instanceof Date ? d : new Date(d);
    return new Date(x.getTime() - x.getTimezoneOffset() * 60000).toISOString();
  } catch {
    return new Date().toISOString();
  }
}

export function autoGranularity(fromISO, toISO_) {
  const from = new Date(fromISO).getTime();
  const to = new Date(toISO_).getTime();
  const diffH = Math.max(1, (to - from) / 36e5);
  if (diffH <= 6) return "minute";
  if (diffH <= 72) return "hour";
  if (diffH <= 24 * 45) return "day";
  if (diffH <= 24 * 120) return "week";
  return "month";
}

export async function fetchMetrics(params) {
  const qs = encodeURIComponent(JSON.stringify(params));
  const url = `${baseUrl}/api/public/metrics?query=${qs}`;

  const headers = new Headers();
  headers.append("Authorization", "Basic " + btoa(`${publicKey}:${secretKey}`));

  const res = await fetch(url, { method: "GET", headers });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`[MetricsAPI ${res.status}] ${body || "Request failed"}`);
  }
  return res.json();
}

/** 미리보기 전용 */
export async function fetchMetricsForPreview(opts) {
  const { viewType, metric, startDate, endDate, filters = [] } = opts;

  const view = ["traces", "observations", "scores"].includes(viewType)
    ? viewType
    : "traces";

  const metricMap = {
    count: { measure: "count", aggregation: "sum" },
    latency: { measure: "latency", aggregation: "avg" },
    observations_count: { measure: "count", aggregation: "sum" },
    scores_count: { measure: "count", aggregation: "sum" },
    total_cost: { measure: "totalCost", aggregation: "sum" },
    total_tokens: { measure: "totalTokens", aggregation: "sum" },
    duration: { measure: "duration", aggregation: "avg" },
    cost: { measure: "cost", aggregation: "sum" },
    input_tokens: { measure: "input_tokens", aggregation: "sum" },
    output_tokens: { measure: "output_tokens", aggregation: "sum" },
  };
  const metricCfg = metricMap[metric] || metricMap.count;

  const fromISO = toISO(startDate);
  const toISO_ = toISO(endDate);
  const gran = autoGranularity(fromISO, toISO_);

  const lfFilters = filters.map((f) => {
    const op = OP_MAP[f.operator] || "contains";
    let val = f.value;
    if (typeof val === "string" && op.includes("in")) {
      val = val
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
    }
    return {
      column: f.column,
      operator: op,
      value: val,
      type: Array.isArray(val) ? "string" : typeof val,
    };
  });

  const params = {
    view,
    metrics: [metricCfg],
    fromTimestamp: fromISO,
    toTimestamp: toISO_,
    filters: lfFilters,
    timeDimension: { granularity: gran },
  };

  const { data } = await fetchMetrics(params);

  return data.map((row) => {
    const keys = Object.keys(row);
    const timeKey = keys.find((k) => /time|timestamp|date/i.test(k)) || keys[0];
    const numKey =
      keys.find((k) => typeof row[k] === "number") || keys[1] || keys[0];
    return { name: row[timeKey] ?? "", value: Number(row[numKey] ?? 0) };
  });
}