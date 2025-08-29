// src/Pages/Widget/components/AdvancedFilters.jsx
import React, { useState, useEffect, useMemo } from "react";
import { Plus, X, Search } from "lucide-react";
import api from "../services";
import styles from "./AdvancedFilters.module.css";

const AdvancedFilters = ({ value = [], onChange, view = "traces" }) => {
  const [filterColumns, setFilterColumns] = useState([]);
  const [filterOptions, setFilterOptions] = useState({});
  const [searchValues, setSearchValues] = useState({});

  // Load filter columns when view changes
  useEffect(() => {
    const loadColumns = async () => {
      try {
        const result = await api.getFilterColumns(view);
        setFilterColumns(result?.data || []);
      } catch (error) {
        console.error("Failed to load filter columns:", error);
        setFilterColumns([]);
      }
    };
    loadColumns();
  }, [view]);

  // Load filter options for dropdown columns
  useEffect(() => {
    const loadOptions = async () => {
      if (filterColumns.length === 0) return;

      try {
        const options = await api.getOptions(view, {
          searchByColumn: searchValues,
          limit: 50,
        });
        setFilterOptions(options || {});
      } catch (error) {
        console.error("Failed to load filter options:", error);
        setFilterOptions({});
      }
    };
    loadOptions();
  }, [view, filterColumns, searchValues]);

  const addFilter = () => {
    const newFilter = {
      id: Date.now(),
      column: filterColumns[0]?.id || "",
      operator: "contains",
      value: "",
    };
    onChange([...value, newFilter]);
  };

  const removeFilter = (id) => {
    onChange(value.filter((f) => f.id !== id));
  };

  const updateFilter = (id, field, newValue) => {
    onChange(value.map((f) => (f.id === id ? { ...f, [field]: newValue } : f)));
  };

  const getOperatorOptions = (columnType) => {
    const baseOptions = [
      { value: "is", label: "is" },
      { value: "is not", label: "is not" },
      { value: "contains", label: "contains" },
      { value: "does not contain", label: "does not contain" },
    ];

    if (columnType?.includes("Options")) {
      return [
        ...baseOptions,
        { value: "in", label: "in" },
        { value: "not in", label: "not in" },
      ];
    }

    return baseOptions;
  };

  const renderValueInput = (filter) => {
    const column = filterColumns.find((c) => c.id === filter.column);
    const columnType = column?.type || "string";
    const options = filterOptions[filter.column] || [];

    if (
      columnType.includes("Options") &&
      ["in", "not in"].includes(filter.operator)
    ) {
      // Multi-select for array options
      return (
        <div className={styles.multiSelectContainer}>
          <div className={styles.searchContainer}>
            <Search size={14} />
            <input
              type="text"
              className={styles.searchInput}
              placeholder="Search options..."
              value={searchValues[filter.column] || ""}
              onChange={(e) => {
                setSearchValues((prev) => ({
                  ...prev,
                  [filter.column]: e.target.value,
                }));
              }}
            />
          </div>
          <div className={styles.optionsList}>
            {options.map((option, index) => {
              const isSelected = (filter.value || []).includes(option.value);
              return (
                <label key={index} className={styles.optionItem}>
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={(e) => {
                      const currentValues = filter.value || [];
                      const newValues = e.target.checked
                        ? [...currentValues, option.value]
                        : currentValues.filter((v) => v !== option.value);
                      updateFilter(filter.id, "value", newValues);
                    }}
                  />
                  <span>{option.value}</span>
                </label>
              );
            })}
          </div>
        </div>
      );
    } else if (columnType.includes("Options")) {
      // Single select dropdown
      return (
        <select
          className={styles.select}
          value={filter.value || ""}
          onChange={(e) => updateFilter(filter.id, "value", e.target.value)}
        >
          <option value="">Select value...</option>
          {options.map((option, index) => (
            <option key={index} value={option.value}>
              {option.value}
            </option>
          ))}
        </select>
      );
    } else {
      // Text input
      return (
        <input
          type="text"
          className={styles.input}
          value={filter.value || ""}
          onChange={(e) => updateFilter(filter.id, "value", e.target.value)}
          placeholder="Enter value..."
        />
      );
    }
  };

  if (filterColumns.length === 0) {
    return (
      <div className={styles.loadingMessage}>Loading filter options...</div>
    );
  }

  return (
    <div className={styles.container}>
      {value.map((filter, index) => (
        <div key={filter.id} className={styles.filterRow}>
          <span className={styles.conjunction}>
            {index === 0 ? "Where" : "And"}
          </span>

          {/* Column Select */}
          <select
            className={styles.select}
            value={filter.column}
            onChange={(e) => {
              updateFilter(filter.id, "column", e.target.value);
              updateFilter(filter.id, "value", ""); // Reset value when column changes
            }}
          >
            {filterColumns.map((column) => (
              <option key={column.id} value={column.id}>
                {column.name}
              </option>
            ))}
          </select>

          {/* Operator Select */}
          <select
            className={styles.select}
            value={filter.operator}
            onChange={(e) => {
              updateFilter(filter.id, "operator", e.target.value);
              updateFilter(filter.id, "value", ""); // Reset value when operator changes
            }}
          >
            {getOperatorOptions(
              filterColumns.find((c) => c.id === filter.column)?.type
            ).map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          {/* Value Input */}
          <div className={styles.valueContainer}>
            {renderValueInput(filter)}
          </div>

          {/* Remove Button */}
          <button
            type="button"
            className={styles.removeButton}
            onClick={() => removeFilter(filter.id)}
            title="Remove filter"
          >
            <X size={16} />
          </button>
        </div>
      ))}

      {/* Add Filter Button */}
      <button type="button" className={styles.addButton} onClick={addFilter}>
        <Plus size={14} />
        Add filter
      </button>
    </div>
  );
};

export default AdvancedFilters;
