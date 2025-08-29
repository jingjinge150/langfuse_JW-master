import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LayoutDashboard } from 'lucide-react';
import FormPageLayout from '../../components/Layouts/FormPageLayout.jsx';
import FormGroup from '../../components/Form/FormGroup.jsx';
import { dashboardAPI } from './services/index.js';

const DashboardNew = () => {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) {
      alert('Dashboard name is required');
      return;
    }

    setLoading(true);
    try {
      console.log('대시보드 생성 요청:', { name, description });
      const result = await dashboardAPI.createDashboard(name.trim(), description.trim());
      
      if (result.success) {
        console.log('대시보드 생성 성공:', result.data);
        // 생성된 대시보드의 상세 페이지로 이동
        navigate(`/dashboards/${result.data.id}`);
      } else {
        console.error('대시보드 생성 실패:', result.error);
        alert(`Failed to create dashboard: ${result.error}`);
      }
    } catch (error) {
      console.error('대시보드 생성 중 오류:', error);
      alert(`Failed to create dashboard: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/dashboards');
  };

  const breadcrumbs = (
    <>
      <LayoutDashboard size={16} />
      <Link to="/dashboards">Dashboards</Link>
      <span>/</span>
      <span className="active">New dashboard</span>
    </>
  );

  return (
    <FormPageLayout
      breadcrumbs={breadcrumbs}
      onSave={handleSave}
      onCancel={handleCancel}
      isSaveDisabled={!name.trim() || loading}
    >
      <FormGroup
        htmlFor="dashboard-name"
        label="Name"
        subLabel="Unique identifier for this dashboard."
      >
        <input
          id="dashboard-name"
          type="text"
          className="form-input"
          placeholder="e.g. daily-token-usage"
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={loading}
        />
      </FormGroup>

      <FormGroup
        htmlFor="dashboard-description"
        label="Description"
        subLabel="Optional description."
      >
        <textarea
          id="dashboard-description"
          className="form-textarea"
          placeholder="Describe the purpose of this dashboard"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          disabled={loading}
        />
      </FormGroup>

      {loading && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: '#0f172a',
            border: '1px solid #1e293b',
            padding: '20px',
            borderRadius: '8px',
            color: '#f8fafc',
            textAlign: 'center'
          }}>
            Creating dashboard...
          </div>
        </div>
      )}
    </FormPageLayout>
  );
};

export default DashboardNew;