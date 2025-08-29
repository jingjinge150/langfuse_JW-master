import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { dashboardAPI, utils } from './services/index.js';
import { Bot, MoreHorizontal, Plus } from 'lucide-react';
import styles from './Dashboards.module.css';

// 액션 드롭다운 컴포넌트
function ActionsDropdown({ dashboard, onEdit, onClone, onDelete, disabled = false }) {
  const [isOpen, setIsOpen] = useState(false);

  const handleAction = (action) => {
    setIsOpen(false);
    if (disabled) return;
    
    switch (action) {
      case 'edit':
        onEdit(dashboard);
        break;
      case 'clone':
        onClone(dashboard);
        break;
      case 'delete':
        onDelete(dashboard);
        break;
    }
  };

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled}
        className={styles.iconButton}
        style={{ opacity: disabled ? 0.5 : 1 }}
      >
        <MoreHorizontal size={16} />
      </button>
      
      {isOpen && !disabled && (
        <div style={{
          position: 'absolute',
          right: 0,
          top: '100%',
          backgroundColor: '#0f172a',
          border: '1px solid #1e293b',
          borderRadius: '4px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
          zIndex: 100,
          minWidth: '120px'
        }}>
          {utils.isDashboardEditable(dashboard) && (
            <button
              onClick={() => handleAction('edit')}
              style={{
                display: 'block',
                width: '100%',
                padding: '8px 12px',
                border: 'none',
                backgroundColor: 'transparent',
                color: '#cbd5e1',
                textAlign: 'left',
                cursor: 'pointer'
              }}
            >
              ✏️ Edit
            </button>
          )}
          <button
            onClick={() => handleAction('clone')}
            style={{
              display: 'block',
              width: '100%',
              padding: '8px 12px',
              border: 'none',
              backgroundColor: 'transparent',
              color: '#cbd5e1',
              textAlign: 'left',
              cursor: 'pointer'
            }}
          >
            📋 Clone
          </button>
          {utils.isDashboardEditable(dashboard) && (
            <button
              onClick={() => handleAction('delete')}
              style={{
                display: 'block',
                width: '100%',
                padding: '8px 12px',
                border: 'none',
                backgroundColor: 'transparent',
                textAlign: 'left',
                cursor: 'pointer',
                color: '#ef4444'
              }}
            >
              🗑️ Delete
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// 메인 DashboardTable 컴포넌트 (모달 제거된 버전)
function DashboardListPage() {
  const [dashboards, setDashboards] = useState([]);
  const [sortConfig, setSortConfig] = useState({ key: 'updatedAt', direction: 'desc' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 초기 데이터 로딩
  useEffect(() => {
    loadDashboards();
  }, []);

  const loadDashboards = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log('대시보드 목록 로딩 시작...');
      const result = await dashboardAPI.getAllDashboards();
      
      if (result.success && Array.isArray(result.data)) {
        console.log('대시보드 데이터 수신:', result.data.length, '개');
        setDashboards(result.data);
      } else {
        console.warn('데이터 형식 오류:', result);
        setDashboards([]);
        if (result.error) {
          setError(result.error);
        }
      }
    } catch (err) {
      console.error('대시보드 로딩 실패:', err);
      setError(`Failed to load dashboards: ${err.message}`);
      setDashboards([]);
    } finally {
      setLoading(false);
    }
  };

  // 정렬 함수
  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // 정렬된 데이터
  const sortedDashboards = [...dashboards].sort((a, b) => {
    if (sortConfig.key) {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];
      
      if (sortConfig.direction === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    }
    return 0;
  });

  // 편집 핸들러 (상세 페이지로 라우팅)
  const handleEdit = (dashboard) => {
    // 편집은 상세 페이지에서 처리하도록 라우팅
    window.location.href = `/dashboards/${dashboard.id}`;
  };

  const handleClone = async (dashboard) => {
    try {
      console.log('대시보드 복제:', dashboard.id);
      const result = await dashboardAPI.cloneDashboard(dashboard.id);
      
      if (result.success) {
        console.log('대시보드 복제 성공:', result);
        alert('Dashboard cloned successfully!');
        await loadDashboards();
      } else {
        alert(`Failed to clone dashboard: ${result.error}`);
      }
    } catch (error) {
      console.error('대시보드 복제 실패:', error);
      alert(`Failed to clone dashboard: ${error.message}`);
    }
  };

  const handleDelete = async (dashboard) => {
    if (!confirm(`Are you sure you want to delete "${dashboard.name}"?`)) {
      return;
    }
    
    try {
      console.log('대시보드 삭제:', dashboard.id);
      const result = await dashboardAPI.deleteDashboard(dashboard.id);
      
      if (result.success) {
        console.log('대시보드 삭제 성공');
        alert('Dashboard deleted successfully!');
        await loadDashboards();
      } else {
        alert(`Failed to delete dashboard: ${result.error}`);
      }
    } catch (error) {
      console.error('대시보드 삭제 실패:', error);
      alert(`Failed to delete dashboard: ${error.message}`);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px', color: '#cbd5e1' }}>
        <div>Loading dashboards...</div>
        <div style={{ fontSize: '12px', color: '#64748b', marginTop: '10px' }}>
          Connecting to Langfuse API...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ textAlign: 'center', padding: '50px', color: '#cbd5e1' }}>
        <div style={{ color: '#ef4444', marginBottom: '20px' }}>
          ❌ {error}
        </div>
        <button
          onClick={loadDashboards}
          className={styles.primaryButton}
        >
          재시도
        </button>
        <div style={{ fontSize: '12px', color: '#64748b', marginTop: '20px' }}>
          💡 Langfuse 서버 (localhost:3000)가 실행 중인지 확인하세요
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* 헤더에 New Dashboard 버튼 추가 */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '24px' 
      }}>
        <h1 style={{ margin: 0, color: '#f1f5f9', fontSize: '24px', fontWeight: '600' }}>
          Dashboards
        </h1>
        <Link 
          to="/dashboards/new"
          className={styles.primaryButton}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            textDecoration: 'none'
          }}
        >
          <Plus size={16} />
          New dashboard
        </Link>
      </div>

      {/* 테이블 */}
      {dashboards.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '50px', color: '#64748b' }}>
          📋 아직 생성된 대시보드가 없습니다.
          <br />
          <br />
          <Link
            to="/dashboards/new"
            className={styles.primaryButton}
          >
            첫 번째 대시보드 생성하기
          </Link>
        </div>
      ) : (
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th 
                  onClick={() => handleSort('name')}
                  style={{ cursor: 'pointer', userSelect: 'none' }}
                >
                  Name {sortConfig.key === 'name' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </th>
                <th>Description</th>
                <th>Owner</th>
                <th 
                  onClick={() => handleSort('createdAt')}
                  style={{ cursor: 'pointer', userSelect: 'none' }}
                >
                  Created At {sortConfig.key === 'createdAt' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </th>
                <th 
                  onClick={() => handleSort('updatedAt')}
                  style={{ cursor: 'pointer', userSelect: 'none' }}
                >
                  Updated At {sortConfig.key === 'updatedAt' && (sortConfig.direction === 'asc' ? '▲' : '▼')}
                </th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sortedDashboards.map(dashboard => (
                <tr key={dashboard.id}>
                  <td>
                    <Link 
                      to={`/dashboards/${dashboard.id}`}
                      className={styles.dashboardLink}
                    >
                      {dashboard.name}
                    </Link>
                  </td>
                  <td>{dashboard.description || <em style={{ color: '#64748b' }}>No description</em>}</td>
                  <td>
                    <div className={styles.ownerCell}>
                      <Bot size={16} />
                      <span>{dashboard.owner === 'LANGFUSE' ? 'Langfuse' : 'Project'}</span>
                    </div>
                  </td>
                  <td style={{ fontSize: '13px', color: '#64748b' }}>
                    {utils.formatDate(dashboard.createdAt)}
                  </td>
                  <td style={{ fontSize: '13px', color: '#64748b' }}>
                    {utils.formatDate(dashboard.updatedAt)}
                  </td>
                  <td>
                    <div className={styles.actionsCell}>
                      <ActionsDropdown
                        dashboard={dashboard}
                        onEdit={handleEdit}
                        onClone={handleClone}
                        onDelete={handleDelete}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default DashboardListPage;