// Widget API Service
// 위젯 관련 API들만 담당

const API_CONFIG = {
    BASE_URL: '', // 직접 Langfuse 서버 지정
    PROJECT_ID: import.meta.env.VITE_LANGFUSE_PROJECT_ID,
  };
  
  class WidgetAPI {
    constructor() {
      this.baseURL = API_CONFIG.BASE_URL;
      this.projectId = API_CONFIG.PROJECT_ID;
    }
  
    // 공통 헤더
    getHeaders() {
      return {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      };
    }
  
    /**
     * tRPC 엔드포인트를 REST처럼 호출하는 헬퍼
     */
    async callTRPCAsREST(endpoint, method = 'GET', data = null) {
      try {
        if (method === 'GET') {
          // GET 요청: tRPC 형식으로 변환
          const params = new URLSearchParams({
            batch: '1',
            input: JSON.stringify({
              0: { json: data }
            })
          });
          
          const response = await fetch(
            `${this.baseURL}/api/trpc/${endpoint}?${params}`,
            {
              method: 'GET',
              headers: this.getHeaders(),
              credentials: 'include',
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
          const response = await fetch(
            `${this.baseURL}/api/trpc/${endpoint}`,
            {
              method: 'POST',
              headers: this.getHeaders(),
              credentials: 'include',
              body: JSON.stringify({ json: data }),
            }
          );
  
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
    // Widget API 메서드들
    // ============================================
  
    /**
     * 개별 위젯 설정 조회
     */
    async getWidget(widgetId) {
      try {
        console.log('위젯 설정 조회:', widgetId);
        
        const data = await this.callTRPCAsREST('dashboardWidgets.get', 'GET', {
          widgetId: widgetId,
          projectId: this.projectId
        });
  
        if (!data) {
          throw new Error('위젯 데이터를 받지 못했습니다');
        }
  
        console.log('위젯 설정:', data);
  
        return {
          success: true,
          data: data
        };
        
      } catch (error) {
        console.error('위젯 조회 실패:', error);
        
        return {
          success: false,
          error: error.message,
          data: null
        };
      }
    }
  
    /**
     * 위젯 데이터 조회 (차트용)
     */
    async executeWidgetQuery(widgetConfig, fromTimestamp, toTimestamp) {
      try {
        console.log('위젯 데이터 조회:', {
          name: widgetConfig.name,
          chartType: widgetConfig.chartType,
          view: widgetConfig.view
        });
  
        // 위젯 설정을 바탕으로 쿼리 생성
        const query = {
          view: widgetConfig.view,
          dimensions: widgetConfig.dimensions || [],
          metrics: widgetConfig.metrics || [{ measure: "count", aggregation: "count" }],
          filters: widgetConfig.filters || [],
          timeDimension: this.getTimeDimension(widgetConfig.chartType),
          fromTimestamp: fromTimestamp,
          toTimestamp: toTimestamp,
          orderBy: null,
          chartConfig: widgetConfig.chartConfig
        };
  
        const data = await this.callTRPCAsREST('dashboard.executeQuery', 'GET', {
          projectId: this.projectId,
          query: query
        });
  
        if (!data) {
          throw new Error('쿼리 실행 결과를 받지 못했습니다');
        }
  
        console.log('위젯 데이터 결과:', data);
  
        return {
          success: true,
          data: data,
          chartType: widgetConfig.chartType
        };
        
      } catch (error) {
        console.error('위젯 데이터 조회 실패:', error);
        
        // 실패 시 목업 데이터 반환 (개발용)
        return this.getMockWidgetData(widgetConfig);
      }
    }
  
    /**
     * 여러 위젯을 한번에 조회 (배치 처리)
     */
    async getMultipleWidgets(widgetIds) {
      try {
        console.log('여러 위젯 조회:', widgetIds);
        
        const promises = widgetIds.map(widgetId => this.getWidget(widgetId));
        const results = await Promise.allSettled(promises);
        
        const widgets = results.map((result, index) => {
          if (result.status === 'fulfilled' && result.value.success) {
            return {
              widgetId: widgetIds[index],
              ...result.value.data
            };
          } else {
            console.error(`위젯 ${widgetIds[index]} 로딩 실패:`, result.reason);
            return {
              widgetId: widgetIds[index],
              error: result.reason?.message || 'Unknown error'
            };
          }
        });
  
        return {
          success: true,
          data: widgets
        };
        
      } catch (error) {
        console.error('여러 위젯 조회 실패:', error);
        
        return {
          success: false,
          error: error.message,
          data: []
        };
      }
    }
  
    /**
     * 대시보드 전체 위젯 데이터 로딩
     */
    async loadDashboardWidgets(widgetLayouts, fromTimestamp, toTimestamp) {
      try {
        console.log('대시보드 위젯들 로딩:', widgetLayouts.length, '개');
  
        const layoutsWithData = [];
        
        for (const layout of widgetLayouts) {
          try {
            // 위젯 설정 조회
            const widgetResult = await this.getWidget(layout.widgetId);
            
            if (widgetResult.success) {
              // 위젯 데이터 조회
              const dataResult = await this.executeWidgetQuery(
                widgetResult.data, 
                fromTimestamp, 
                toTimestamp
              );
              
              layoutsWithData.push({
                ...layout,
                widget: widgetResult.data,
                chartData: dataResult.data,
                isMockData: dataResult.isMockData || false,
                error: null
              });
            } else {
              // 위젯 로딩 실패 시 에러 정보 포함
              layoutsWithData.push({
                ...layout,
                widget: { 
                  name: "Loading Error", 
                  chartType: "NUMBER",
                  description: "Failed to load widget configuration"
                },
                chartData: [{ count_count: "Error" }],
                error: widgetResult.error,
                isMockData: true
              });
            }
          } catch (error) {
            console.error(`위젯 ${layout.widgetId} 로딩 실패:`, error);
            layoutsWithData.push({
              ...layout,
              widget: { 
                name: "Load Failed", 
                chartType: "NUMBER",
                description: "Widget loading failed"
              },
              chartData: [{ count_count: "Failed" }],
              error: error.message,
              isMockData: true
            });
          }
        }
  
        return {
          success: true,
          data: layoutsWithData
        };
  
      } catch (error) {
        console.error('대시보드 위젯들 로딩 실패:', error);
        
        return {
          success: false,
          error: error.message,
          data: []
        };
      }
    }
  
    // ============================================
    // 헬퍼 메서드들
    // ============================================
  
    /**
     * 차트 타입에 따른 timeDimension 설정
     */
    getTimeDimension(chartType) {
      switch (chartType) {
        case 'NUMBER':
          return null;
        case 'BAR_TIME_SERIES':
        case 'LINE_TIME_SERIES':
          return { granularity: "auto" };
        default:
          return null;
      }
    }
  
    /**
     * 목업 데이터 생성 (API 실패 시 fallback)
     */
    getMockWidgetData(widgetConfig) {
      const chartType = widgetConfig.chartType;
      
      if (chartType === 'NUMBER') {
        return {
          success: true,
          data: [{ count_count: "Loading..." }],
          chartType: chartType,
          isMockData: true
        };
      } else if (chartType === 'BAR_TIME_SERIES' || chartType === 'LINE_TIME_SERIES') {
        return {
          success: true,
          data: [
            { time_dimension: "2025-08-20", count_count: "50" },
            { time_dimension: "2025-08-21", count_count: "75" },
            { time_dimension: "2025-08-22", count_count: "100" },
            { time_dimension: "2025-08-23", count_count: "25" },
            { time_dimension: "2025-08-24", count_count: "80" }
          ],
          chartType: chartType,
          isMockData: true
        };
      }
      
      return {
        success: false,
        error: 'Unsupported chart type',
        data: null,
        chartType: chartType
      };
    }
  }
  
  // 유틸리티 함수들
  export const widgetUtils = {
    /**
     * 그리드 위치를 CSS Grid 스타일로 변환
     */
    getGridStyle(layout) {
      return {
        gridColumn: `${layout.x + 1} / span ${layout.x_size}`,
        gridRow: `${layout.y + 1} / span ${layout.y_size}`,
      };
    },
  
    /**
     * 차트 데이터 포맷팅
     */
    formatChartData(data, chartType) {
      if (!data || !Array.isArray(data)) return [];
      
      switch (chartType) {
        case 'NUMBER':
          return data[0]?.count_count || '0';
        case 'BAR_TIME_SERIES':
        case 'LINE_TIME_SERIES':
          return data.map(item => ({
            date: item.time_dimension,
            value: parseInt(item.count_count) || 0,
            label: item.environment || null
          }));
        default:
          return data;
      }
    },
  
    /**
     * 위젯 크기 클래스 반환
     */
    getWidgetSizeClass(layout) {
      const size = layout.x_size * layout.y_size;
      if (size <= 9) return 'widget-small';
      if (size <= 20) return 'widget-medium';
      return 'widget-large';
    }
  };
  
  // 싱글톤 인스턴스
  const widgetAPI = new WidgetAPI();
  export { widgetAPI };
  export default widgetAPI;