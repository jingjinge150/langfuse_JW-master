// src/components/FilterControls/EnvironmentFilter.jsx
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import styles from './EnvironmentFilter.module.css';

// 임시 데이터
const ALL_ENVIRONMENTS = [
  { id: 'env1', name: 'default' },
  { id: 'env2', name: 'langfuse-prompt-experiment' },
];

const EnvironmentFilter = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [environments, setEnvironments] = useState(
    ALL_ENVIRONMENTS.map(env => ({ ...env, checked: env.name === 'default' }))
  );
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef(null);

  // 외부 클릭 시 드롭다운 닫기
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedEnvs = useMemo(() => environments.filter(e => e.checked), [environments]);
  const isAllSelected = useMemo(() => environments.length > 0 && selectedEnvs.length === environments.length, [environments, selectedEnvs]);

  const buttonLabel = useMemo(() => {
    if (selectedEnvs.length === 0) return 'None';
    if (selectedEnvs.length === 1) return selectedEnvs[0].name;
    if (selectedEnvs.length === environments.length) return 'All';
    return `${selectedEnvs.length} selected`;
  }, [selectedEnvs, environments.length]);

  const filteredEnvironments = useMemo(() =>
    environments.filter(env => env.name.toLowerCase().includes(searchTerm.toLowerCase())),
    [environments, searchTerm]
  );
  
  const handleToggle = (id) => {
    setEnvironments(prev =>
      prev.map(env => (env.id === id ? { ...env, checked: !env.checked } : env))
    );
  };

  const handleSelectAll = (isChecked) => {
    setEnvironments(prev => prev.map(env => ({ ...env, checked: isChecked })));
  };
  
  const handleClear = () => {
    setEnvironments(prev => prev.map(env => ({ ...env, checked: false })));
  };

  return (
    <div className={styles.container} ref={dropdownRef}>
      <button className={styles.filterButton} onClick={() => setIsOpen(!isOpen)}>
        <span>Env</span>
        <span className={styles.value}>{buttonLabel}</span>
        <ChevronDown size={16} />
      </button>

      {isOpen && (
        <div className={styles.dropdownMenu}>
          <input
            type="text"
            placeholder="Environment"
            className={styles.searchInput}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <div className={styles.optionsList}>
            <label className={styles.optionItem}>
              <input
                type="checkbox"
                checked={isAllSelected}
                onChange={(e) => handleSelectAll(e.target.checked)}
              />
              <span>Select All</span>
            </label>
            {filteredEnvironments.map(env => (
              <label key={env.id} className={styles.optionItem}>
                <input
                  type="checkbox"
                  checked={env.checked}
                  onChange={() => handleToggle(env.id)}
                />
                <span>{env.name}</span>
              </label>
            ))}
          </div>
          <button className={styles.clearButton} onClick={handleClear}>
            Clear filters
          </button>
        </div>
      )}
    </div>
  );
};

export default EnvironmentFilter;