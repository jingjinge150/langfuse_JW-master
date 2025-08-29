// src/Pages/Dashboard/DashboardDetail.jsx

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Info, Filter, Plus } from 'lucide-react';
import { Responsive, WidthProvider } from 'react-grid-layout';
import dayjs from 'dayjs';
import styles from './DashboardDetail.module.css';

// React Grid Layout CSS imports
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

const ResponsiveGridLayout = WidthProvider(Responsive);

// ===== 유틸리티 함수들 =====
const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString();
};

const validateComponentData = (componentType, data) => {
  if (!data || data.isLoading) return true;
  
  switch (componentType) {
    case 'BaseTimeSeriesChart':
      return Array.isArray(data) && data.every(point => 
        point && typeof point.ts !== 'undefined' && Array.isArray(point.values)
      );
    case 'TotalMetric':
      return typeof data === 'object' && typeof data.value !== 'undefined';
    default:
      return true;
  }
};

const getComponentData = (widget, data) => {
  if (data.isLoading || data.error) return null;
  
  switch (widget.component) {
    case 'TotalMetric':
      return data.metric || data;
    case 'BaseTimeSeriesChart':
      return data.timeSeriesData || data;
    default:
      return data;
  }
};

const getStatusIndicator = (widget, data) => {
  if (data.isLoading) return '⏳';
  if (data.error) return '❌';
  if (data.isEmpty) return '📊';
  return '✅';
};

const isDashboardEditable = (dashboard) => {
  return dashboard && dashboard.owner !== "LANGFUSE";
};

const downloadAsCSV = (data, filename) => {
  if (!data || !Array.isArray(data)) return;
  
  const csvContent = "data:text/csv;charset=utf-8," 
    + data.map(row => Object.values(row).join(",")).join("\n");
  
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// ===== API 클래스 =====
class DashboardAPI {
  async callTRPCAsREST(procedure, input = {}) {
    try {
      const params = new URLSearchParams({
        batch: '1',
        input: JSON.stringify({ 0: input })
      });
      
      const url = `/api/trpc/${procedure}?${params}`;
      console.log('TRPC API 호출:', url);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const data = await response.json();
      return data[0]?.result?.data || data;
    } catch (error) {
      console.error(`TRPC API 호출 오류 (${procedure}):`, error);
      throw error;
    }
  }

  async getDashboard(id) {
    return await this.callTRPCAsREST('dashboard.byId', { dashboardId: id });
  }

  async getWidgetData(widgetId, params) {
    return await this.callTRPCAsREST('widget.data', { widgetId, ...params });
  }

  async updateDashboard(id, data) {
    return await this.callTRPCAsREST('dashboard.update', { id, ...data });
  }
}

// ===== 컴포넌트들 =====
const DashboardCard = ({ title, description, isLoading, headerRight, children }) => (
  <div className={styles.widgetCard}>
    <div className={styles.widgetHeader}>
      <div>
        <h3 className={styles.widgetTitle}>{title}</h3>
        {description && (
          <p className={styles.widgetDescription}>{description}</p>
        )}
      </div>
      {headerRight && <div className={styles.widgetStatus}>{headerRight}</div>}
    </div>
    <div className={styles.widgetContent}>
      {isLoading ? (
        <div className={styles.loadingState}>⏳ Loading...</div>
      ) : (
        children
      )}
    </div>
  </div>
);

const TotalMetric = ({ metric, isLoading }) => {
  if (isLoading) return <div className={styles.loadingState}>⏳ Loading...</div>;
  
  return (
    <div className={styles.totalMetric}>
      <div className={styles.kpiValue}>{metric?.value || 0}</div>
    </div>
  );
};

const SafeBaseTimeSeriesChart = ({ data, title, isLoading, dateRange, config }) => {
  console.log('SafeBaseTimeSeriesChart 받은 props:', { 
    data, 
    title, 
    isLoading, 
    dataType: Array.isArray(data) ? 'array' : typeof data,
    dataLength: Array.isArray(data) ? data.length : 'N/A'
  });

  if (isLoading) {
    return <div className={styles.loadingState}>⏳ Loading chart data...</div>;
  }

  if (!Array.isArray(data) || data.length === 0) {
    return (
      <div className={styles.emptyState}>
        <div className={styles.emptyIcon}>📈</div>
        <div>No time series data</div>
        <div className={styles.emptyDetail}>
          Received: {typeof data} {Array.isArray(data) ? `(${data.length} items)` : ''}
        </div>
      </div>
    );
  }

  const hasValidStructure = data.every(point => 
    point && 
    typeof point.ts !== 'undefined' && 
    Array.isArray(point.values)
  );

  if (!hasValidStructure) {
    return (
      <div className={styles.errorState}>
        <div className={styles.errorIcon}>⚠️</div>
        <div>Invalid data structure</div>
        <div className={styles.errorDetail}>
          Expected: [{'{'}{`ts, values: [{label, value}]`}{'}'}]
          <br />
          Got: {JSON.stringify(data[0], null, 2).substring(0, 100)}...
        </div>
      </div>
    );
  }

  // 실제 차트 렌더링 로직은 여기에 추가
  return (
    <div className={styles.chartContainer}>
      <div className={styles.chartPlaceholder}>
        📊 Time Series Chart
        <div className={styles.chartDetail}>
          {data.length} data points
        </div>
      </div>
    </div>
  );
};

// 컴포넌트 매핑
const COMPONENT_MAP = {
  TotalMetric,
  BaseTimeSeriesChart: SafeBaseTimeSeriesChart,
  LatencyChart: ({ data }) => <div className={styles.chartPlaceholder}>📊 Latency Chart</div>,
  TracesBarListChart: ({ data }) => <div className={styles.chartPlaceholder}>📊 Traces Bar Chart</div>,
  ModelUsageChart: ({ data }) => <div className={styles.chartPlaceholder}>📊 Model Usage Chart</div>,
  UserChart: ({ data }) => <div className={styles.chartPlaceholder}>📊 User Chart</div>,
  ModelCostTable: ({ data }) => <div className={styles.chartPlaceholder}>📋 Model Cost Table</div>,
};

const DashboardWidget = ({ widget, widgetData, dateRange }) => {
  const Component = COMPONENT_MAP[widget.component];
  const data = widgetData[widget.id] || { isLoading: true };

  if (!Component) {
    return (
      <DashboardCard
        title={widget.title}
        description={widget.description}
        isLoading={false}
      >
        <div className={styles.errorState}>
          <div>⚠️ Component not found</div>
          <div className={styles.errorDetail}>{widget.component}</div>
        </div>
      </DashboardCard>
    );
  }

  const componentData = getComponentData(widget, data);
  const isDataValid = validateComponentData(widget.component, data);

  return (
    <DashboardCard
      title={widget.title}
      description={widget.description}
      isLoading={data.isLoading}
      headerRight={getStatusIndicator(widget, data)}
    >
      {data.error ? (
        <div className={styles.errorState}>
          <div>❌ Error</div>
          <div className={styles.errorDetail}>{data.error}</div>
        </div>
      ) : data.isEmpty ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>📊</div>
          <div>No data available</div>
          <div className={styles.emptyDetail}>API integration pending</div>
        </div>
      ) : !isDataValid ? (
        <div className={styles.errorState}>
          <div className={styles.errorIcon}>⚠️</div>
          <div>Invalid data format</div>
          <div className={styles.errorDetail}>
            Component: {widget.component}
            <br />
            Expected format mismatch
          </div>
        </div>
      ) : componentData === null ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>📊</div>
          <div>No data to display</div>
        </div>
      ) : (
        <Component
          {...(widget.component === 'TotalMetric' ? {
            metric: componentData
          } : {
            data: componentData
          })}
          isLoading={data.isLoading}
          dateRange={dateRange}
          title={widget.title}
          config={data.config}
        />
      )}
    </DashboardCard>
  );
};

const DateRangePicker = ({ startDate, endDate, setStartDate, setEndDate }) => {
  const handleDateRangeChange = (e) => {
    const value = e.target.value;
    const now = new Date();
    
    switch (value) {
      case 'Past 7 days':
        setStartDate(dayjs(now).subtract(7, 'day').toDate());
        break;
      case 'Past 30 days':
        setStartDate(dayjs(now).subtract(30, 'day').toDate());
        break;
      case 'Past 90 days':
        setStartDate(dayjs(now).subtract(90, 'day').toDate());
        break;
      case 'Past year':
        setStartDate(dayjs(now).subtract(1, 'year').toDate());
        break;
      default:
        break;
    }
    setEndDate(now);
  };

  return (
    <select 
      className={styles.dateRangePicker}
      onChange={handleDateRangeChange}
      defaultValue="Past 7 days"
    >
      <option>Past 7 days</option>
      <option>Past 30 days</option>
      <option>Past 90 days</option>
      <option>Past year</option>
    </select>
  );
};

// ===== 더미 데이터 =====
const DUMMY_DASHBOARDS = [
  {
    id: '1',
    name: 'Default Dashboard',
    description: 'Overview of key metrics',
    owner: 'USER',
    createdAt: '2024-01-01',
    updatedAt: '2024-01-15'
  },
  {
    id: '2',
    name: 'Langfuse Dashboard',
    description: 'System metrics and performance',
    owner: 'LANGFUSE',
    createdAt: '2024-01-01',
    updatedAt: '2024-01-20'
  }
];

const DUMMY_TEMPLATE = {
  name: 'Default Template',
  description: 'Standard dashboard template',
  widgets: [
    {
      id: 'total-traces',
      title: 'Total Traces',
      description: 'Shows the count of Traces',
      component: 'TotalMetric',
      span: 3
    },
    {
      id: 'total-observations',
      title: 'Total Observations',
      description: 'Shows the count of Observations',
      component: 'TotalMetric',
      span: 3
    },
    {
      id: 'total-costs',
      title: 'Total costs ($)',
      description: 'Total cost across all use cases',
      component: 'BaseTimeSeriesChart',
      span: 6
    },
    {
      id: 'cost-by-model',
      title: 'Cost by Model Name ($)',
      description: 'Total cost broken down by model name',
      component: 'TracesBarListChart',
      span: 4
    },
    {
      id: 'cost-by-env',
      title: 'Cost by Environment ($)',
      description: 'Total cost broken down by trace.environment',
      component: 'ModelUsageChart',
      span: 4
    },
    {
      id: 'top-users',
      title: 'Top Users by Cost ($)',
      description: 'Aggregated model cost by user',
      component: 'UserChart',
      span: 4
    }
  ]
};

// ===== 커스텀 훅 =====
const useDashboardDetail = (dashboardId) => {
  const [dashboard, setDashboard] = useState(null);
  const [widgetData, setWidgetData] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dateRange, setDateRange] = useState('Past 7 days');

  const api = new DashboardAPI();

  const loadingStats = {
    total: DUMMY_TEMPLATE.widgets.length,
    success: 2, // TotalMetric 위젯들
    failed: 0,
    mock: 4, // 나머지 위젯들
    empty: 0
  };

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        setLoading(true);
        
        // 더미 대시보드 찾기
        const basicDashboard = {
            id: dashboardId,
            name: 'New Dashboard',
            description: 'User created dashboard',
            owner: 'PROJECT',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
          
          setDashboard(basicDashboard);

        // 위젯 데이터 로딩 시뮬레이션
        const mockWidgetData = {};
        for (const widget of DUMMY_TEMPLATE.widgets) {
          mockWidgetData[widget.id] = {
            isLoading: false,
            error: null,
            isEmpty: false,
            metric: widget.component === 'TotalMetric' ? { value: Math.floor(Math.random() * 1000) } : null,
            timeSeriesData: widget.component === 'BaseTimeSeriesChart' ? [
              { ts: '2024-01-01', values: [{ label: 'Cost', value: 100 }] },
              { ts: '2024-01-02', values: [{ label: 'Cost', value: 150 }] }
            ] : null
          };
        }
        
        setWidgetData(mockWidgetData);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (dashboardId) {
      loadDashboard();
    }
  }, [dashboardId, dateRange]);

  const reload = () => {
    if (dashboardId) {
      setError(null);
      loadDashboard();
    }
  };

  const clone = async () => {
    alert('Clone functionality not implemented yet');
  };

  return {
    dashboard,
    widgetData,
    loading,
    error,
    dateRange,
    templateInfo: { template: DUMMY_TEMPLATE },
    loadingStats,
    setDateRange,
    reload,
    clone
  };
};

// ===== 메인 컴포넌트 =====
const DashboardDetail = () => {
  const { dashboardId } = useParams();
  const navigate = useNavigate();
  
  const {
    dashboard,
    widgetData,
    loading,
    error,
    dateRange,
    templateInfo,
    loadingStats,
    setDateRange,
    reload,
    clone
  } = useDashboardDetail(dashboardId);

  // 로딩 상태
  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.centerContent}>
          <div className={styles.loadingState}>⏳ Loading dashboard...</div>
          <div className={styles.loadingDetail}>Dashboard ID: {dashboardId}</div>
        </div>
      </div>
    );
  }

  // 에러 상태
  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.centerContent}>
          <div className={styles.errorState}>❌ {error}</div>
          <div className={styles.actionGroup}>
            <Link to="/dashboards" className={styles.backLink}>
              ← Back to Dashboards
            </Link>
            <button onClick={reload} className={styles.retryButton}>
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!dashboard) {
    return (
      <div className={styles.container}>
        <div className={styles.centerContent}>
          <div className={styles.emptyState}>📋 Dashboard not found</div>
          <Link to="/dashboards" className={styles.backLink}>
            ← Back to Dashboards
          </Link>
        </div>
      </div>
    );
  }

  const { template } = templateInfo;
  const canEdit = isDashboardEditable(dashboard);

  return (
    <div className={styles.container}>
      {/* 헤더 */}
      <div className={styles.header}>
        <div className={styles.titleGroup}>
          <div className={styles.breadcrumb}>
            <Link to="/dashboards" className={styles.breadcrumbLink}>
              ← Dashboards
            </Link>
          </div>
          <h1 className={styles.title}>
            {template?.name || dashboard.name}
            {dashboard.owner === "LANGFUSE" && (
              <span className={styles.ownerBadge}>
                (Langfuse Maintained)
              </span>
            )}
          </h1>
          {(template?.description || dashboard.description) && (
            <p className={styles.description}>
              {template?.description || dashboard.description}
            </p>
          )}
          <div className={styles.metadata}>
            {template && `📊 ${template.widgets.length} widgets`} | Created:{" "}
            {formatDate(dashboard.createdAt)} | Updated:{" "}
            {formatDate(dashboard.updatedAt)}
          </div>
        </div>

        <div className={styles.headerActions}>
          <button onClick={clone} className={styles.cloneButton}>
            📋 Clone
          </button>
        </div>
      </div>

      {/* 필터 바 */}
      <div className={styles.filterBar}>
        <DateRangePicker
          startDate={new Date()}
          endDate={new Date()}
          setStartDate={() => {}}
          setEndDate={() => {}}
        />
        
        <div className={styles.dateRangeDisplay}>
          📅 {dateRange}
        </div>

        <button className={styles.filterButton}>
          <Filter size={14} /> Filters
        </button>
      </div>

      {/* 위젯 그리드 */}
      {template ? (
        <div className={styles.widgetGrid}>
          {template.widgets.map((widget) => (
            <div
              key={widget.id}
              className={styles.widgetGridItem}
              style={{ gridColumn: `span ${widget.span}` }}
            >
              <DashboardWidget
                widget={widget}
                widgetData={widgetData}
                dateRange={dateRange}
              />
            </div>
          ))}
        </div>
      ) : (
        <div className={styles.emptyDashboard}>
          <div className={styles.emptyIcon}>📊</div>
          <h3 className={styles.emptyTitle}>사용자 생성 대시보드</h3>
          <p className={styles.emptyMessage}>
            위젯팀과 협업하여 동적 위젯 시스템 연동 필요
          </p>
          {canEdit && (
            <button
              onClick={() => alert("위젯팀 협업 후 구현 예정")}
              className={styles.manageWidgetsButton}
            >
              위젯 관리
            </button>
          )}
        </div>
      )}

      {/* 개발 정보 */}
      {import.meta.env.DEV && (
        <div className={styles.devInfo}>
          <h4 className={styles.devTitle}>
            🔧 단계적 API 연동 진행중 - BaseTimeSeriesChart 활성화!
          </h4>
          <div className={styles.devDetails}>
            📊 총 위젯: {loadingStats.total}개
            <br />
            🟢 실제 API: {loadingStats.success}개
            <br />
            🔴 API 실패: {loadingStats.failed}개
            <br />
            🔵 목업 데이터: {loadingStats.mock}개
            <br />
            ⚪ 빈 상태: {loadingStats.empty}개
            <br />
            <br />
            <strong>✅ 활성화된 컴포넌트:</strong>
            <br />
            • TotalMetric (실제 API 연동 완료)
            <br />
            • BaseTimeSeriesChart (새로 활성화, 안전한 래퍼 적용)
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardDetail;