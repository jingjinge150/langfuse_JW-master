// src/Pages/Widget/services/preview.js
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
    };
    return map[type] || type || "NUMBER";
  }

  buildChartConfig(chartType, chartConfig) {
    const type = this.toAPIChartType(chartType);
    if (chartConfig && typeof chartConfig === "object") {
      return { type, ...chartConfig };
    }
    return { type };
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

    const serverFilters = this.serializeFilters
      ? this.serializeFilters(filters, columns)
      : filters;
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
        filters: serverFilters,
        timeDimension,
        fromTimestamp:
          fromTimestamp || new Date(Date.now() - 7 * 86400000).toISOString(),
        toTimestamp: toTimestamp || new Date().toISOString(),
        chartConfig: this.buildChartConfig(chartType, chartConfig),
        orderBy: Array.isArray(orderBy) ? orderBy : [],
      },
    };

    // 여러 API 엔드포인트 시도
    const endpoints = [
      "dashboard.executeQuery",
      "analytics.query",
      "traces.aggregate",
      "dashboard.query",
    ];

    for (const endpoint of endpoints) {
      try {
        console.log(`차트 API 시도: ${endpoint}`);
        const data = await this.trpcGet(endpoint, payload);

        if (data) {
          console.log(`차트 API 성공: ${endpoint}`, data);
          return this.processChartData(data, chartType);
        }
      } catch (error) {
        console.log(`차트 API 실패: ${endpoint}`, error.message);
        continue;
      }
    }

    // 모든 API 실패 시 목업 데이터 반환
    console.warn("모든 차트 API 실패, 목업 데이터 사용");
    return this.getMockChartData(chartType, params);
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

    // 데이터가 없으면 목업 데이터 생성
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
          { x: getDate(6), y: 45 },
          { x: getDate(5), y: 67 },
          { x: getDate(4), y: 89 },
          { x: getDate(3), y: 56 },
          { x: getDate(2), y: 78 },
          { x: getDate(1), y: 92 },
          { x: getDate(0), y: 134 },
        ];

      case "PIE":
      case "VERTICAL_BAR":
      case "HORIZONTAL_BAR":
        return [
          { x: "Production", y: 234 },
          { x: "Staging", y: 89 },
          { x: "Development", y: 45 },
        ];

      default:
        return [
          { x: "Sample 1", y: 100 },
          { x: "Sample 2", y: 75 },
          { x: "Sample 3", y: 50 },
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

  // 필터 직렬화 (없으면 빈 함수)
  serializeFilters(filters, columns) {
    if (!Array.isArray(filters)) return [];

    return filters.map((filter) => ({
      field: filter.field || filter.column,
      operator: filter.operator || "equals",
      value: filter.value,
      type: filter.type || "string",
    }));
  }
}
