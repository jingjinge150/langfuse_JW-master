// Dashboard API Service
// 위젯팀 방식과 완전 동일하게 클래스 기반으로 구현

const API_CONFIG = {
  BASE_URL: "", // 직접 Langfuse 서버 지정
  PROJECT_ID: import.meta.env.VITE_LANGFUSE_PROJECT_ID,
};

class DashboardAPI {
  constructor() {
    this.baseURL = API_CONFIG.BASE_URL;
    this.projectId = API_CONFIG.PROJECT_ID;
  }

  // 공통 헤더 (위젯팀과 동일)
  getHeaders() {
    return {
      "Content-Type": "application/json",
      Accept: "application/json",
    };
  }

  /**
   * tRPC 엔드포인트를 REST처럼 호출하는 헬퍼 (위젯팀 코드 정확 복사)
   */
  async callTRPCAsREST(endpoint, method = "GET", data = null) {
    try {
      if (method === "GET") {
        // GET 요청: tRPC 형식으로 변환
        const params = new URLSearchParams({
          batch: "1",
          input: JSON.stringify({
            0: { json: data },
          }),
        });

        const response = await fetch(
          `${this.baseURL}/api/trpc/${endpoint}?${params}`,
          {
            method: "GET",
            headers: this.getHeaders(),
            credentials: "include",
          }
        );

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`API 오류 (${endpoint}):`, errorText);
          throw new Error(`API 오류: ${response.status}`);
        }

        const result = await response.json();
        // tRPC 응답에서 실제 데이터 추출
        return result[0]?.result?.data?.json || null;
      } else {
        // POST 요청
        const response = await fetch(`${this.baseURL}/api/trpc/${endpoint}`, {
          method: "POST",
          headers: this.getHeaders(),
          credentials: "include",
          body: JSON.stringify({ json: data }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`API 오류 (${endpoint}):`, errorText);
          throw new Error(`API 오류: ${response.status}`);
        }

        const result = await response.json();
        // tRPC 응답에서 실제 데이터 추출
        return result?.result?.data?.json || null;
      }
    } catch (error) {
      console.error(`TRPC API 호출 오류 (${endpoint}):`, error);
      throw error;
    }
  }

  // ============================================
  // Dashboard API 메서드들 (위젯팀 패턴 적용)
  // ============================================

  /**
   * GET /dashboards
   * 대시보드 목록 조회 (위젯팀 getDashboards 함수와 동일)
   */
  async getAllDashboards(page = 0, limit = 50) {
    try {
      console.log("대시보드 목록 조회 시작:", { page, limit });

      const data = await this.callTRPCAsREST("dashboard.allDashboards", "GET", {
        projectId: this.projectId,
        page,
        limit,
        orderBy: { column: "updatedAt", order: "DESC" },
      });

      if (!data) {
        throw new Error("대시보드 데이터를 받지 못했습니다");
      }

      console.log("대시보드 데이터 수신:", data);

      return {
        success: true,
        data: data?.dashboards || [],
        totalItems: data?.totalCount || 0,
        meta: {
          totalCount: data?.totalCount || 0,
          hasMore: data?.hasMore || false,
        },
      };
    } catch (error) {
      console.error("대시보드 목록 조회 실패:", error);

      return {
        success: false,
        error: error.message,
        data: [],
        totalItems: 0,
        meta: {
          totalCount: 0,
          hasMore: false,
        },
      };
    }
  }

  /**
   * GET /dashboard/:id
   * 개별 대시보드 조회
   */
  async getDashboard(dashboardId) {
    try {
      console.log("대시보드 개별 조회:", dashboardId);

      const data = await this.callTRPCAsREST("dashboard.getDashboard", "GET", {
        projectId: this.projectId,
        dashboardId: dashboardId,
      });

      console.log("대시보드 데이터:", data);

      return {
        success: true,
        data: data,
      };
    } catch (error) {
      console.error("대시보드 조회 실패:", error);

      return {
        success: false,
        error: error.message,
        data: null,
      };
    }
  }

  /**
   * POST /dashboards
   * 대시보드 생성
   */
  async createDashboard(name, description) {
    try {
      console.log("대시보드 생성 요청:", { name, description });

      const payload = {
        projectId: this.projectId,
        name: name.trim(),
        description: description?.trim() || "",
      };

      const data = await this.callTRPCAsREST(
        "dashboard.createDashboard",
        "POST",
        payload
      );

      if (!data) {
        throw new Error("대시보드 생성 응답을 받지 못했습니다");
      }

      console.log("대시보드 생성 성공:", data);

      return {
        success: true,
        data: data,
      };
    } catch (error) {
      console.error("대시보드 생성 실패:", error);

      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * PUT /dashboards/:id
   * 대시보드 수정
   */
  async updateDashboard(dashboardId, name, description) {
    try {
      console.log("대시보드 수정 요청:", { dashboardId, name, description });

      const payload = {
        projectId: this.projectId,
        dashboardId: dashboardId,
        name: name.trim(),
        description: description?.trim() || "",
      };

      const data = await this.callTRPCAsREST(
        "dashboard.updateDashboardMetadata",
        "POST",
        payload
      );

      if (!data) {
        throw new Error("대시보드 수정 응답을 받지 못했습니다");
      }

      console.log("대시보드 수정 성공:", data);

      return {
        success: true,
        data: data,
      };
    } catch (error) {
      console.error("대시보드 수정 실패:", error);

      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * POST /dashboards/:id/clone
   * 대시보드 복제
   */
  async cloneDashboard(dashboardId) {
    try {
      console.log("대시보드 복제 요청:", dashboardId);

      const data = await this.callTRPCAsREST(
        "dashboard.cloneDashboard",
        "POST",
        {
          projectId: this.projectId,
          dashboardId: dashboardId,
        }
      );

      console.log("대시보드 복제 성공:", data);

      return {
        success: true,
        data: data,
      };
    } catch (error) {
      console.error("대시보드 복제 실패:", error);

      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * DELETE /dashboards/:id
   * 대시보드 삭제
   */
  async deleteDashboard(dashboardId) {
    try {
      console.log("대시보드 삭제 요청:", dashboardId);

      const data = await this.callTRPCAsREST("dashboard.delete", "POST", {
        projectId: this.projectId,
        dashboardId: dashboardId,
      });
      console.log("대시보드 삭제 성공");

      return {
        success: true,
        message: "대시보드가 삭제되었습니다.",
      };
    } catch (error) {
      console.error("대시보드 삭제 실패:", error);

      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * POST /execute-query
   * 대시보드 쿼리 실행
   */
  async executeQuery(sql, params = {}) {
    try {
      console.log("쿼리 실행:", { sql, params });

      const query = {
        projectId: this.projectId,
        sql: sql,
        params: params,
      };

      const data = await this.callTRPCAsREST(
        "dashboard.executeQuery",
        "POST",
        query
      );

      if (!data) {
        throw new Error("쿼리 실행 결과를 받지 못했습니다");
      }

      console.log("쿼리 실행 결과:", data);

      return {
        success: true,
        data: data,
      };
    } catch (error) {
      console.error("쿼리 실행 실패:", error);

      return {
        success: false,
        error: error.message,
        data: null,
      };
    }
  }
}

// 유틸리티 함수들
export const utils = {
  // 날짜 포맷 함수
  formatDate(dateString) {
    if (!dateString) return "";
    try {
      return new Date(dateString).toLocaleDateString("ko-KR", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (error) {
      return dateString;
    }
  },

  // 대시보드 소유자 타입 확인
  isDashboardEditable(dashboard) {
    return dashboard.owner === "PROJECT";
  },

  // 프로젝트 ID 가져오기
  getCurrentProjectId() {
    return import.meta.env.VITE_LANGFUSE_PROJECT_ID;
  },
};

// 에러 타입들
export class APIError extends Error {
  constructor(message, status, details) {
    super(message);
    this.name = "APIError";
    this.status = status;
    this.details = details;
  }
}

// 싱글톤 인스턴스 (위젯팀과 동일)
const dashboardAPI = new DashboardAPI();
export { dashboardAPI };
export default dashboardAPI;
