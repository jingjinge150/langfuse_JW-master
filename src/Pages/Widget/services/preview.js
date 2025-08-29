import { FiltersAPI } from "./filters.js";

export class PreviewAPI extends FiltersAPI {
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
      LINE_TIME_SERIES: "LINE_TIME_SERIES",
      BAR_TIME_SERIES: "BAR_TIME_SERIES",
      VERTICAL_BAR: "VERTICAL_BAR",
      HORIZONTAL_BAR: "HORIZONTAL_BAR",
      NUMBER: "NUMBER",
      HISTOGRAM: "HISTOGRAM",
      PIE: "PIE",
      PIVOT_TABLE: "PIVOT_TABLE",
    };
    return map[type] || "NUMBER";
  }

  buildChartConfig(chartType, chartConfig) {
    const type = this.toAPIChartType(chartType);
    return chartConfig && typeof chartConfig === "object"
      ? { type, ...chartConfig }
      : { type };
  }

  sanitizeFilters(inputFilters = [], columns = []) {
    const alias = { user: "userId", session: "sessionId", traceName: "name" };
    const opMap = {
      contains: "CONTAINS",
      "not contains": "NOT_CONTAINS",
      not_contains: "NOT_CONTAINS",
      in: "IN",
      not_in: "NOT_IN",
      "=": "=",
      "is equal to": "=",
      is: "=",
      "!=": "!=",
      ">": ">",
      "<": "<",
      ">=": ">=",
      "<=": "<=",
    };

    const colMeta = Object.fromEntries(
      (columns || []).map((c) => [c.id || c.column || c.name, c])
    );

    const cleaned = (inputFilters || [])
      .map((f) => {
        const rawCol = f.field ?? f.column ?? f.id ?? f.name;
        if (!rawCol) return null;

        const column = alias[rawCol] || rawCol;

        let operator = (f.operator || f.op || "contains").toString().toLowerCase();
        operator = opMap[operator] || "CONTAINS";

        let value = f.value ?? f.values ?? (f.list ? [...f.list] : undefined);

        if ((operator === "IN" || operator === "NOT_IN") && typeof value === "string") {
          value = value
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean);
        }

        const type = colMeta[rawCol]?.type || "string";
        if (type === "arrayOptions" && !Array.isArray(value)) {
          value = value != null ? [value] : [];
        }

        return { column, operator, value };
      })
      .filter(
        (f) =>
          f &&
          f.column &&
          f.operator &&
          !(
            f.value == null ||
            (typeof f.value === "string" && f.value.trim() === "") ||
            (Array.isArray(f.value) && f.value.length === 0)
          )
      );

    const seen = new Set();
    return cleaned.filter((f) => {
      const k = `${f.column}|${f.operator}|${JSON.stringify(f.value)}`;
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });
  }

  async executeQuery(params = {}, columns = []) {
    const {
      view = "traces",
      dimensions = [],
      metrics = [{ measure: "count", aggregation: "count" }],
      filters = [],
      fromTimestamp,
      toTimestamp,
      chartType = "LINE_TIME_SERIES",
      timeDimension = { granularity: "auto" },
      orderBy = [],
      chartConfig = null,
    } = params;

    const serialized =
      typeof this.serializeFilters === "function"
        ? this.serializeFilters(filters, columns)
        : filters;

    const cleanFilters = this.sanitizeFilters(serialized, columns);

    const dims = (dimensions || []).map((d) =>
      typeof d === "string" ? { field: d } : d
    );

    const normalizedMetrics = (metrics || []).map((m) => ({
      measure: m?.measure ?? m?.columnId ?? "count",
      aggregation: m?.aggregation ?? "count",
    }));

    const payload = {
      projectId: this.projectId,
      query: {
        view,
        dimensions: dims,
        metrics: normalizedMetrics,
        filters: cleanFilters,
        timeDimension: timeDimension || { granularity: "auto" },
        fromTimestamp:
          fromTimestamp || new Date(Date.now() - 7 * 86400000).toISOString(),
        toTimestamp: toTimestamp || new Date().toISOString(),
        chartConfig: this.buildChartConfig(chartType, chartConfig),
        orderBy: Array.isArray(orderBy) ? orderBy : [],
      },
    };

    const workingEndpoints = ["dashboard.executeQuery"];

    for (const endpoint of workingEndpoints) {
      try {
        console.log(`차트 API 시도: ${endpoint}`);
        const data = await this.trpcGet(endpoint, payload);
        if (data) {
          console.log(`차트 API 성공: ${endpoint}`, data);
          return this.processChartData(data, this.toAPIChartType(chartType));
        }
      } catch (error) {
        console.log(`차트 API 실패: ${endpoint}`, error?.message || error);
      }
    }

    console.warn("차트 API 실패, 목업 데이터 사용");
    return this.getMockChartData(this.toAPIChartType(chartType), params);
  }

  processChartData(data, chartType) {
    const raw =
      data?.chartData || data?.data || data?.series || data?.results || [];

    let chartData = [];

    if (Array.isArray(raw) && raw.length > 0) {
      chartData = raw
        .map((p, index) => {
          if (Array.isArray(p)) {
            return { x: p[0], y: Number(p[1]) || 0 };
          }
          const x =
            p.time ||
            p.timestamp ||
            p.date ||
            p.bucket ||
            p.x ||
            p.name ||
            `Point ${index + 1}`;
          const y = Number(
            p.value ?? p.y ?? p.count ?? p.total ?? p.metric ?? 0
          );
          return { x, y, ...p };
        })
        .filter(Boolean);
    }

    if (chartData.length === 0) {
      chartData = this.generateMockChartData(chartType);
    }

    const value =
      typeof data?.value === "number"
        ? data.value
        : chartData.reduce((s, d) => s + (d?.y || 0), 0);

    return {
      success: true,
      data: {
        value,
        chartType,
        chartData,
        rawData: data,
        isMockData: chartData.length === 0 || !data,
      },
    };
  }

  generateMockChartData(chartType) {
    const now = new Date();
    const getDate = (daysAgo) => {
      const date = new Date(now);
      date.setDate(date.getDate() - daysAgo);
      return date.toISOString().split("T")[0];
    };

    switch (chartType) {
      case "LINE_TIME_SERIES":
      case "BAR_TIME_SERIES":
        return [
          { x: getDate(6), y: 0 },
          { x: getDate(5), y: 0 },
          { x: getDate(4), y: 0 },
          { x: getDate(3), y: 0 },
          { x: getDate(2), y: 0 },
          { x: getDate(1), y: 0 },
          { x: getDate(0), y: 0 },
        ];
      case "PIE":
      case "VERTICAL_BAR":
      case "HORIZONTAL_BAR":
        return [
          { x: "Production", y: 0 },
          { x: "Staging", y: 0 },
          { x: "Development", y: 0 },
        ];
      default:
        return [
          { x: "Sample 1", y: 0 },
          { x: "Sample 2", y: 0 },
          { x: "Sample 3", y: 0 },
        ];
    }
  }

  getMockChartData(chartType, params = {}) {
    const chartData = this.generateMockChartData(chartType);
    const value = chartData.reduce((s, d) => s + (d?.y || 0), 0);

    return {
      success: true,
      data: {
        value: chartType === "NUMBER" ? value.toString() : value,
        chartType,
        chartData,
        rawData: { mockData: true, params },
        isMockData: true,
      },
    };
  }

  serializeFilters(filters) {
    if (!Array.isArray(filters)) return [];
    return filters.map((f) => ({
      field: f.field || f.column || f.id || f.name,
      operator: f.operator || "contains",
      value: f.value ?? f.values,
      type: f.type || "string",
    }));
  }
}
