// src/components/FilterControls/FilterBuilder.jsx
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Filter, X, Plus } from 'lucide-react';
import FilterButton from '../FilterButton/FilterButton';
import styles from './FilterBuilder.module.css';

// 필터 옵션 (임시 데이터)
const COLUMN_OPTIONS = ['Column', 'Trace Name', 'User ID', 'Session ID', 'Tags', 'Model'];
const OPERATOR_OPTIONS = ['is', 'is not', 'contains', 'does not contain'];

const FilterBuilder = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [filters, setFilters] = useState([]);
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
  
  const activeFilterCount = useMemo(() => filters.filter(f => f.value.trim() !== '').length, [filters]);

  const addFilter = () => {
    const newFilter = {
      id: Date.now(),
      column: COLUMN_OPTIONS[0],
      operator: OPERATOR_OPTIONS[0],
      value: ''
    };
    setFilters(prev => [...prev, newFilter]);
  };

  const removeFilter = (id) => {
    setFilters(prev => prev.filter(f => f.id !== id));
  };
  
  const updateFilter = (id, field, value) => {
    setFilters(prev => prev.map(f => (f.id === id ? { ...f, [field]: value } : f)));
  };

  return (
    <div className={styles.container} ref={dropdownRef}>
      <FilterButton onClick={() => setIsOpen(!isOpen)}>
        <Filter size={14} /> Filters
        {activeFilterCount > 0 && <span className={styles.badge}>{activeFilterCount}</span>}
      </FilterButton>

      {isOpen && (
        <div className={styles.dropdownMenu}>
          {filters.map((filter, index) => (
            <div key={filter.id} className={styles.filterRow}>
              <span className={styles.conjunction}>{index === 0 ? 'Where' : 'And'}</span>
              <select 
                className={styles.select} 
                value={filter.column} 
                onChange={e => updateFilter(filter.id, 'column', e.target.value)}
              >
                {COLUMN_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
              </select>
              <select 
                className={styles.select} 
                value={filter.operator}
                onChange={e => updateFilter(filter.id, 'operator', e.target.value)}
              >
                {OPERATOR_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
              </select>
              <input
                type="text"
                className={styles.input}
                value={filter.value}
                onChange={e => updateFilter(filter.id, 'value', e.target.value)}
              />
              <button className={styles.removeButton} onClick={() => removeFilter(filter.id)}>
                <X size={16} />
              </button>
            </div>
          ))}
          <button className={styles.addButton} onClick={addFilter}>
            <Plus size={14} /> Add filter
          </button>
        </div>
      )}
    </div>
  );
};

export default FilterBuilder;