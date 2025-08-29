// src/Pages/Widget/services/widgets.js
import { ApiClient } from "./apiClient.js";

const DEBUG = import.meta.env.DEV;

function extractItems(d) {
  if (!d) return [];

  // tRPC 응답 구조 처리 - 이 부분이 누락되어 있었음!
  if (d.json) {
    return extractItems(d.json);
  }

  // 기존 로직
  if (Array.isArray(d.widgets)) return d.widgets;
  if (Array.isArray(d.items)) return d.items;
  if (Array.isArray(d)) return d;
  if (Array.isArray(d.edges))
    return d.edges.map((e) => e?.node).filter(Boolean);
  if (Array.isArray(d.rows)) return d.rows;
  if (d.data) {
    if (Array.isArray(d.data.widgets)) return d.data.widgets;
    return extractItems(d.data);
  }

  // 추가 확인 - 객체의 첫 번째 값이 배열인 경우
  if (typeof d === "object" && d !== null) {
    const values = Object.values(d);
    const firstArray = values.find((v) => Array.isArray(v));
    if (firstArray) return firstArray;
  }

  return [];
}

export class WidgetsAPI extends ApiClient {
  async getWidgets(page = 1, pageSize = 50, order = "DESC") {
    const payload = {
      page: Math.max(0, Number(page) - 1),
      limit: Number(pageSize),
      orderBy: { column: "updatedAt", order },
      projectId: this.projectId,
    };

    try {
      console.log("[WidgetsAPI] 요청 시작:", payload);

      const data = await this.trpcGet("dashboardWidgets.all", payload);

      if (DEBUG) {
        console.log(
          "[WidgetsAPI] raw response:",
          JSON.stringify(data, null, 2)
        );
      }

      const items = extractItems(data);

      if (DEBUG) {
        console.log("[WidgetsAPI] extracted items:", items);
        console.log(
          "[WidgetsAPI] extracted count:",
          items.length,
          "first item keys:",
          items[0] ? Object.keys(items[0]) : "none"
        );

        // 첫 번째 아이템 상세 로그
        if (items[0]) {
          console.log(
            "[WidgetsAPI] first item:",
            JSON.stringify(items[0], null, 2)
          );
        }
      }

      // totalCount도 json 안에 있을 수 있음
      const jsonData = data?.json || data;
      const total =
        jsonData?.totalCount ??
        jsonData?.total ??
        jsonData?.totalItems ??
        jsonData?.count ??
        data?.totalCount ??
        data?.total ??
        data?.totalItems ??
        data?.count ??
        items.length;

      const totalPages = Math.max(
        1,
        Math.ceil((Number(total || items.length) || 1) / (payload.limit || 1))
      );

      console.log("[WidgetsAPI] 최종 결과:", {
        itemCount: items.length,
        total,
        totalPages,
        hasItems: items.length > 0,
      });

      return { data: items, totalPages };
    } catch (error) {
      console.error("Failed to fetch widgets:", error);
      console.error("Error stack:", error.stack);
      return { data: [], totalPages: 1 };
    }
  }

  async deleteWidget(id) {
    if (!id) return { success: false, error: "id 필요" };

    try {
      const result = await this.trpcPost("dashboardWidgets.delete", {
        projectId: this.projectId,
        id,
      });

      if (DEBUG) {
        console.log("[WidgetsAPI] delete result:", result);
      }

      return { success: true, data: result };
    } catch (error) {
      console.error("Failed to delete widget:", error);
      return { success: false, error: error.message };
    }
  }

  async createWidget(payload) {
    try {
      const result = await this.trpcPost("dashboardWidgets.create", {
        projectId: this.projectId,
        ...payload,
      });

      if (DEBUG) {
        console.log("[WidgetsAPI] create result:", result);
      }

      return { success: true, data: result };
    } catch (error) {
      console.error("Failed to create widget:", error);
      throw error;
    }
  }

  // 디버깅용 - API 응답 구조 확인
  async debugApiStructure() {
    try {
      console.log("[WidgetsAPI] API 구조 디버깅 시작");

      const payload = {
        page: 0,
        limit: 1, // 하나만 가져와서 구조 확인
        orderBy: { column: "updatedAt", order: "DESC" },
        projectId: this.projectId,
      };

      const data = await this.trpcGet("dashboardWidgets.all", payload);

      console.log("[WidgetsAPI] 전체 응답 구조:");
      console.log("- Type:", typeof data);
      console.log("- Keys:", data ? Object.keys(data) : "null");
      console.log("- JSON:", JSON.stringify(data, null, 2));

      if (data?.json) {
        console.log("[WidgetsAPI] json 내부 구조:");
        console.log("- Type:", typeof data.json);
        console.log("- Keys:", Object.keys(data.json));
        console.log("- JSON:", JSON.stringify(data.json, null, 2));
      }

      return data;
    } catch (error) {
      console.error("[WidgetsAPI] 디버깅 실패:", error);
      return null;
    }
  }
}