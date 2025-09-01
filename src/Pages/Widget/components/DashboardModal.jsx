// src/Pages/Widget/components/DashboardModal.jsx
import React, { useState, useEffect } from "react";
import styles from "../../Dashboard/Dashboards.module.css";

export default function DashboardModal({ 
  isOpen, 
  onClose, 
  onSave,  // Skip과 대시보드 추가 둘 다 처리
  projectId,
  api 
}) {
  const [dashboards, setDashboards] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isOpen) return;
    
    const fetchDashboards = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // API를 통해 대시보드 목록 가져오기
        const response = await api.trpcGet("dashboard.allDashboards", {
          projectId,
          orderBy: { column: "updatedAt", order: "DESC" },
          page: 0,
          limit: 100
        });
        
        // 응답 데이터 추출 (다양한 응답 구조 처리)
        const items = 
          response?.json?.dashboards || 
          response?.json?.items ||
          response?.dashboards || 
          response?.data?.dashboards ||
          response?.data ||
          [];
        
        console.log("대시보드 목록 로드 성공:", items);
        setDashboards(Array.isArray(items) ? items : []);
        
      } catch (error) {
        console.error("대시보드 로드 실패:", error);
        setError("대시보드 목록을 불러올 수 없습니다");
        setDashboards([]);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboards();
  }, [isOpen, projectId, api]);

  if (!isOpen) return null;

  // Skip 버튼 - 위젯만 저장 (대시보드 없이)
  const handleSkip = () => {
    onSave(null); // dashboardId 없이 저장
    onClose();
  };

  // Add to Dashboard 버튼 - 선택한 대시보드에 추가
  const handleAddToDashboard = () => {
    if (selectedId) {
      onSave(selectedId); // 선택한 dashboardId와 함께 저장
      onClose();
    }
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div 
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        backdropFilter: 'blur(4px)'
      }}
      onClick={handleOverlayClick}
    >
      <div 
        style={{
          backgroundColor: '#020817',
          border: '1px solid #1e293b',
          borderRadius: '8px',
          width: '90%',
          maxWidth: '600px',
          maxHeight: '80vh',
          display: 'flex',
          flexDirection: 'column'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div className={styles.header} style={{ 
          padding: '20px', 
          borderBottom: '1px solid #1e293b',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div className={styles.title}>
            <h1 style={{ fontSize: '20px', margin: 0 }}>
              Select dashboard to add widget to
            </h1>
          </div>
          <button 
            className={styles.iconButton}
            onClick={onClose}
            style={{ 
              fontSize: '24px',
              background: 'none',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer'
            }}
          >
            ×
          </button>
        </div>

        {/* 바디 - 테이블 형식 */}
        <div style={{ 
          flex: 1, 
          overflowY: 'auto', 
          padding: '0',
          minHeight: '200px'
        }}>
          {loading ? (
            <div style={{ 
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '200px',
              color: '#94a3b8'
            }}>
              대시보드 목록을 불러오는 중...
            </div>
          ) : error ? (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '200px',
              color: '#ef4444',
              textAlign: 'center',
              padding: '20px'
            }}>
              <p>{error}</p>
              <button 
                onClick={() => window.location.reload()}
                style={{
                  marginTop: '10px',
                  padding: '8px 16px',
                  background: '#1e293b',
                  border: 'none',
                  borderRadius: '4px',
                  color: '#94a3b8',
                  cursor: 'pointer'
                }}
              >
                새로고침
              </button>
            </div>
          ) : dashboards.length === 0 ? (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '200px',
              color: '#94a3b8',
              textAlign: 'center'
            }}>
              <p>대시보드가 없습니다.</p>
              <p style={{ fontSize: '14px', marginTop: '8px' }}>
                먼저 대시보드를 생성해주세요.
              </p>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #1e293b' }}>
                  <th style={{ 
                    padding: '12px 20px',
                    textAlign: 'left',
                    color: '#94a3b8',
                    fontSize: '13px',
                    fontWeight: '500'
                  }}>
                    Name
                  </th>
                  <th style={{ 
                    padding: '12px 20px',
                    textAlign: 'left',
                    color: '#94a3b8',
                    fontSize: '13px',
                    fontWeight: '500'
                  }}>
                    Description
                  </th>
                  <th style={{ 
                    padding: '12px 20px',
                    textAlign: 'left',
                    color: '#94a3b8',
                    fontSize: '13px',
                    fontWeight: '500'
                  }}>
                    Updated
                  </th>
                </tr>
              </thead>
              <tbody>
                {dashboards.map((dashboard) => (
                  <tr
                    key={dashboard.id}
                    style={{
                      borderBottom: '1px solid #1e293b',
                      cursor: 'pointer',
                      backgroundColor: selectedId === dashboard.id ? '#1e3a8a' : 'transparent',
                      transition: 'background-color 0.2s'
                    }}
                    onClick={() => setSelectedId(dashboard.id)}
                    onMouseEnter={(e) => {
                      if (selectedId !== dashboard.id) {
                        e.currentTarget.style.backgroundColor = '#1e293b';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (selectedId !== dashboard.id) {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }
                    }}
                  >
                    <td style={{ 
                      padding: '12px 20px',
                      color: '#f8fafc',
                      fontSize: '14px'
                    }}>
                      {dashboard.name}
                    </td>
                    <td style={{ 
                      padding: '12px 20px',
                      color: '#94a3b8',
                      fontSize: '13px'
                    }}>
                      {dashboard.description || '-'}
                    </td>
                    <td style={{ 
                      padding: '12px 20px',
                      color: '#64748b',
                      fontSize: '12px'
                    }}>
                      {new Date(dashboard.updatedAt).toLocaleDateString('ko-KR')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* 푸터 - Skip과 Add to Dashboard */}
        <div style={{ 
          padding: '20px', 
          borderTop: '1px solid #1e293b',
          display: 'flex',
          gap: '12px',
          justifyContent: 'flex-end'
        }}>
          <button
            onClick={handleSkip}
            style={{
              padding: '10px 20px',
              borderRadius: '6px',
              backgroundColor: 'transparent',
              border: '1px solid #334155',
              color: '#94a3b8',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            Skip
          </button>
          
          <button
            className={styles.primaryButton}
            onClick={handleAddToDashboard}
            disabled={!selectedId}
            style={{
              padding: '10px 20px',
              opacity: selectedId ? 1 : 0.5,
              cursor: selectedId ? 'pointer' : 'not-allowed'
            }}
          >
            Add to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}