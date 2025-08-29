// src/components/FilterControls/FilterControls.jsx
import React from 'react';
import styles from './FilterControls.module.css';
import TimeRangeFilter from './TimeRangeFilter';
import EnvironmentFilter from './EnvironmentFilter';
import FilterBuilder from './FilterBuilder';
import RefreshButton from './RefreshButton'; // 새로고침 버튼 import

const FilterControls = ({ onRefresh }) => {
  return (
    <div className={styles.filterControls}>
      <TimeRangeFilter />
      <EnvironmentFilter />
      <FilterBuilder />
      {onRefresh && <RefreshButton onClick={onRefresh} />}
    </div>
  );
};

export default FilterControls;