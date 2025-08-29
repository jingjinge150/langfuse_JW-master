import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { DataTable } from '../../components/DataTable/DataTable';
import { Bot, ChevronDown, ChevronUp, MoreVertical, Edit, Copy, Trash2 } from 'lucide-react';
import styles from './Dashboards.module.css';
import { dashboardAPI } from './services/index.js';

const formatDate = (dateString) => {
  if (!dateString) return '';
  try {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (error) {
    return dateString;
  }
};

// 액션 드롭다운 컴포넌트
const ActionDropdown = ({ row, onEdit, onClone, onDelete }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // 외부 클릭 감지
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleActionClick = (action) => {
    action(row);
    setIsOpen(false);
  };

  return (
    <div className={styles.actionDropdown} ref={dropdownRef}>
      <button
        className={styles.actionButton}
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
      >
        <MoreVertical size={16} />
      </button>
      
      {isOpen && (
        <div className={styles.dropdownMenu}>
          <button
            className={styles.dropdownItem}
            onClick={(e) => {
              e.stopPropagation();
              handleActionClick(onEdit);
            }}
          >
            <Edit size={14} />
            Edit
          </button>
          <button
            className={styles.dropdownItem}
            onClick={(e) => {
              e.stopPropagation();
              handleActionClick(onClone);
            }}
          >
            <Copy size={14} />
            Clone
          </button>
          <button
            className={`${styles.dropdownItem} ${styles.deleteItem}`}
            onClick={(e) => {
              e.stopPropagation();
              handleActionClick(onDelete);
            }}
          >
            <Trash2 size={14} />
            Delete
          </button>
        </div>
      )}
    </div>
  );
};

export const DashboardsView = () => {
  const [dashboards, setDashboards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortConfig, setSortConfig] = useState({ key: 'updatedAt', direction: 'desc' });

  useEffect(() => {
    loadDashboards();
  }, []);

  const loadDashboards = async () => {
    try {
      setLoading(true);
      const result = await dashboardAPI.getAllDashboards();
      
      if (result.success) {
        setDashboards(result.data);
      }
    } catch (err) {
      console.error("Failed to fetch dashboards:", err);
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

  // 데이터 정렬
  const sortedDashboards = React.useMemo(() => {
    const sortableItems = [...dashboards];
    if (sortConfig.key) {
      sortableItems.sort((a, b) => {
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];

        // 날짜 정렬의 경우
        if (sortConfig.key === 'updatedAt' || sortConfig.key === 'createdAt') {
          aValue = new Date(aValue);
          bValue = new Date(bValue);
        }

        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [dashboards, sortConfig]);

  // 정렬 아이콘 렌더링
  const getSortIcon = (columnKey) => {
    if (sortConfig.key !== columnKey) {
      return <ChevronDown size={14} className={styles.sortIcon} />;
    }
    return sortConfig.direction === 'asc' 
      ? <ChevronUp size={14} className={styles.sortIconActive} />
      : <ChevronDown size={14} className={styles.sortIconActive} />;
  };
  // 액션 핸들러들
  const handleEdit = (dashboard) => {
    console.log('Edit dashboard:', dashboard);
    // TODO: 편집 모달 또는 페이지로 이동
    // navigate(`/dashboards/${dashboard.id}/edit`);
  };

  const handleClone = async (dashboard) => {
    try {
      console.log('Clone dashboard:', dashboard);
      
      const result = await dashboardAPI.cloneDashboard(dashboard.id);
      
      if (result.success) {
        // 성공 시 목록 새로고침
        await loadDashboards();
        console.log('Dashboard cloned successfully');
        // TODO: 성공 토스트 메시지 표시
      } else {
        console.error('Failed to clone dashboard:', result.error);
        alert(`Failed to clone dashboard: ${result.error}`);
      }
    } catch (error) {
      console.error('Error cloning dashboard:', error);
      alert('An error occurred while cloning the dashboard');
    }
  };

  const handleDelete = async (dashboard) => {
    if (!window.confirm(`Are you sure you want to delete "${dashboard.name}"?`)) {
      return;
    }

    try {
      console.log('Delete dashboard:', dashboard);
      
      const result = await dashboardAPI.deleteDashboard(dashboard.id);
      
      if (result.success) {
        // 성공 시 목록에서 제거
        await loadDashboards();
        console.log('Dashboard deleted successfully');
        // TODO: 성공 토스트 메시지 표시
      } else {
        console.error('Failed to delete dashboard:', result.error);
        alert(`Failed to delete dashboard: ${result.error}`);
      }
    } catch (error) {
      console.error('Error deleting dashboard:', error);
      alert('An error occurred while deleting the dashboard');
    }
  };

  const columns = [
    {
      header: 'Name',
      accessor: (row) => (
        <Link
          to={`/dashboards/${row.id}`}
          className={styles.dashboardLink}
        >
          {row.name}
        </Link>
      ),
    },
    {
      header: 'Description',
      accessor: (row) => row.description || <em style={{ color: '#64748b' }}>No description</em>,
    },
    {
      header: 'Owner',
      accessor: (row) => (
        <div className={styles.ownerCell}>
          <Bot size={16} />
          <span>{row.owner === 'LANGFUSE' ? 'Langfuse' : 'Project'}</span>
        </div>
      ),
    },
    {
      header: 'Created At',
      accessor: (row) => formatDate(row.createdAt),
    },
    {
      header: (
        <div 
          className={styles.sortableHeader}
          onClick={() => handleSort('updatedAt')}
        >
          Updated At {getSortIcon('updatedAt')}
        </div>
      ),
      accessor: (row) => formatDate(row.updatedAt),
    },
    {
      header: 'Actions',
      accessor: (row) => (
        <ActionDropdown
          row={row}
          onEdit={handleEdit}
          onClone={handleClone}
          onDelete={handleDelete}
        />
      ),
    },
  ];

  if (loading) {
    return <div>Loading dashboards...</div>;
  }

  return (
    <DataTable
      columns={columns}
      data={sortedDashboards}
      keyField="id"
      renderEmptyState={() => <div>No dashboards found.</div>}
    />
  );
};