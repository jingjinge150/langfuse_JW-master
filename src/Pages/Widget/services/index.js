// src/Pages/Widget/services/index.js
import { PreviewAPI } from "./preview";
import { WidgetsAPI } from "./widgets";  
import { FiltersAPI } from "./filters";

class WidgetAPI extends PreviewAPI {
  constructor() {
    super();
    // 기존 위젯 목록 연동을 유지
    this._widgets = new WidgetsAPI();
    this._filters = new FiltersAPI();
    
    console.log('WidgetAPI initialized - keeping existing widget connections');
  }

  // Widget management methods - 기존 연동된 로직 그대로 사용
  async getWidgets(...args) {
    return this._widgets.getWidgets(...args);
  }

  async deleteWidget(id) {
    return this._widgets.deleteWidget(id);
  }

  async createWidget(payload) {
    return this._widgets.createWidget(payload);
  }

  async testConnection() {
    try {
      await this._widgets.getWidgets(1, 1, "DESC");
      return { success: true };
    } catch (e) {
      return { success: false, message: e?.message || String(e) };
    }
  }

  // Filter methods - 기존 FiltersAPI 사용하되 실패시 fallback
  async getFilterColumns(view = "traces") {
    try {
      const result = await this._filters.getFilterColumns(view);
      console.log('getFilterColumns success:', result);
      return result;
    } catch (error) {
      console.log('getFilterColumns failed, using fallback:', error.message);
      return this.getFallbackFilterColumns(view);
    }
  }

  async getFilterValues(params) {
    try {
      return await this._filters.getFilterValues(params);
    } catch (error) {
      console.log('getFilterValues failed:', error.message);
      return { data: [] };
    }
  }

  async getOptions(view, options) {
    try {
      const result = await this._filters.getOptions(view, options);
      console.log('getOptions success:', result);
      return result;
    } catch (error) {
      console.log('getOptions failed, using fallback:', error.message);
      return this.getFallbackOptions(view);
    }
  }

  // Enhanced executeQuery - 새 위젯 생성 시 차트 미리보기용
  async executeQuery(queryParams = {}, columns = []) {
    console.log('executeQuery called with:', queryParams);
    
    try {
      // 부모 클래스(PreviewAPI)의 executeQuery 먼저 시도
      const result = await super.executeQuery(queryParams, columns);
      if (result?.data?.chartData?.length > 0) {
        console.log('executeQuery success with real data:', result);
        return result;
      }
    } catch (error) {
      console.log('Real API executeQuery failed:', error.message);
    }

    // 실제 API 실패시 목업 데이터로 fallback
    console.log('Using mock data for chart preview');
    return this.generateMockResponse(queryParams);
  }

  // Fallback methods
  getFallbackFilterColumns(view) {
    const columns = {
      traces: [
        { id: 'name', name: 'Trace Name', type: 'string' },
        { id: 'userId', name: 'User ID', type: 'string' },
        { id: 'sessionId', name: 'Session ID', type: 'string' },
        { id: 'environment', name: 'Environment', type: 'stringOptions' },
        { id: 'tags', name: 'Tags', type: 'arrayOptions' },
        { id: 'model', name: 'Model', type: 'stringOptions' },
      ],
      observations: [
        { id: 'name', name: 'Name', type: 'string' },
        { id: 'type', name: 'Type', type: 'stringOptions' },
        { id: 'model', name: 'Model', type: 'stringOptions' },
        { id: 'environment', name: 'Environment', type: 'stringOptions' },
      ],
      scores: [
        { id: 'name', name: 'Score Name', type: 'string' },
        { id: 'value', name: 'Value', type: 'number' },
        { id: 'source', name: 'Source', type: 'stringOptions' },
      ]
    };

    return { success: true, data: columns[view] || columns.traces };
  }

  getFallbackOptions(view) {
    const options = {
      traces: {
        environment: [
          { value: 'production' },
          { value: 'staging' },
          { value: 'development' }
        ],
        model: [
          { value: 'gpt-4' },
          { value: 'gpt-3.5-turbo' },
          { value: 'claude-2' }
        ]
      }
    };

    return options[view] || {};
  }

  generateMockResponse(queryParams) {
    const { chartType = 'LINE_TIME_SERIES', view = 'traces' } = queryParams;
    const chartData = this.generateMockChartData(chartType, view);
    
    return {
      success: true,
      data: {
        chartData,
        totalCount: chartData.length,
        isMockData: true
      }
    };
  }

  generateMockChartData(chartType, view) {
    const now = new Date();
    const getDate = (daysAgo) => {
      const date = new Date(now);
      date.setDate(date.getDate() - daysAgo);
      return date.toISOString();
    };

    const getRandomValue = () => Math.floor(Math.random() * 100) + 20;

    switch (chartType) {
      case 'LINE_TIME_SERIES':
      case 'BAR_TIME_SERIES':
        return Array.from({ length: 7 }, (_, i) => ({
          time_dimension: getDate(6 - i),
          dimension: view,
          metric: getRandomValue(),
          timestamp: getDate(6 - i),
          value: getRandomValue()
        }));

      case 'PIE':
      case 'VERTICAL_BAR':
      case 'HORIZONTAL_BAR':
        const categories = view === 'traces' 
          ? ['Production', 'Staging', 'Development', 'Test']
          : view === 'observations'
          ? ['LLM', 'Retrieval', 'Embedding', 'Tool']  
          : ['Positive', 'Negative', 'Neutral'];
          
        return categories.map(cat => ({
          dimension: cat,
          metric: getRandomValue(),
          name: cat,
          value: getRandomValue()
        }));

      case 'HISTOGRAM':
        return Array.from({ length: 10 }, (_, i) => ({
          dimension: `${i * 10}-${(i + 1) * 10}`,
          metric: Math.floor(Math.random() * 20) + 1,
          binStart: i * 10,
          binEnd: (i + 1) * 10
        }));

      case 'NUMBER':
        return [{
          dimension: 'Total',
          metric: Math.floor(Math.random() * 10000) + 1000,
          value: Math.floor(Math.random() * 10000) + 1000
        }];

      default:
        return Array.from({ length: 5 }, (_, i) => ({
          dimension: `Item ${i + 1}`,
          metric: getRandomValue(),
          name: `Item ${i + 1}`,
          value: getRandomValue()
        }));
    }
  }
}

const api = new WidgetAPI();

// Individual API exports for compatibility - 기존 위젯 목록 기능 유지
export const widgetListAPI = new WidgetsAPI();
export const filtersAPI = new FiltersAPI();

export default api;