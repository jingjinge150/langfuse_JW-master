// Services 통합 Export

// Dashboard 관련 API (기존)
import dashboardAPI, { utils } from './dashboardAPI.js';

// Widget 관련 API (새로 생성)
import widgetAPI, { widgetUtils } from './widgetAPI.js';

// 개별 export
export { dashboardAPI, widgetAPI, utils, widgetUtils };

// 통합된 API 객체 (선택적 사용)
export const api = {
  dashboard: dashboardAPI,
  widget: widgetAPI
};

// 자주 사용하는 유틸들 통합
export const commonUtils = {
  ...utils,
  ...widgetUtils,
  
  /**
   * 날짜 범위 생성 (대시보드 필터용)
   */
  getDateRange(days = 7) {
    const toTimestamp = new Date().toISOString();
    const fromTimestamp = new Date(Date.now() - (days * 24 * 60 * 60 * 1000)).toISOString();
    
    return {
      fromTimestamp,
      toTimestamp
    };
  },

  /**
   * 차트 색상 팔레트
   */
  getChartColors() {
    return [
      '#2E8B57', // Sea Green
      '#4682B4', // Steel Blue  
      '#CD853F', // Peru
      '#9932CC', // Dark Violet
      '#DC143C', // Crimson
      '#FF8C00', // Dark Orange
      '#008B8B', // Dark Cyan
      '#B22222'  // Fire Brick
    ];
  }
};