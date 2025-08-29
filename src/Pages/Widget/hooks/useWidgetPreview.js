// src/Pages/Widget/hooks/useWidgetPreview.js
import { useEffect, useState } from "react";
import widgetAPI from "../services";

export default function useWidgetPreview(config, columns = []) {
  const [loading, setLoading] = useState(false);
  const [previewData, setPreviewData] = useState({
    count: 0,
    formattedChartData: [],
  });

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);

        // 여기서 바로 executeQuery를 호출하면 내부에서 filters를 서버 포맷으로 직렬화해줌
        const { success, data } = await widgetAPI.executeQuery(
          {
            view: config.view,
            dimensions: config.dimensions || [],
            metrics: (config.metrics || []).map((m) => ({
              measure: m.measure || m.columnId || "count",
              aggregation: m.aggregation || "count",
            })),
            filters: config.filters || [],
            fromTimestamp:
              config?.dateRange?.from?.toISOString?.() || undefined,
            toTimestamp: config?.dateRange?.to?.toISOString?.() || undefined,
            chartType: widgetAPI.buildChartConfig
              ? config.chartType
              : "LINE_TIME_SERIES",
            timeDimension: { granularity: "auto" },
            orderBy: [],
          },
          columns
        );

        if (!alive) return;

        if (success) {
          setPreviewData({
            count: data?.value || 0,
            formattedChartData: data?.chartData || [],
          });
        } else {
          setPreviewData({ count: 0, formattedChartData: [] });
        }
      } catch (e) {
        if (alive) setPreviewData({ count: 0, formattedChartData: [] });
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [
    config.view,
    JSON.stringify(config.dimensions || []),
    JSON.stringify(config.metrics || []),
    JSON.stringify(config.filters || []),
    config?.dateRange?.from?.toISOString?.(),
    config?.dateRange?.to?.toISOString?.(),
    config.chartType,
    JSON.stringify(columns || []),
  ]);

  return { loading, previewData };
}
