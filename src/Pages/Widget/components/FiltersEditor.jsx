// src/Pages/Widget/components/FiltersEditor.jsx
import React, { useMemo } from "react";
import AsyncSelect from "react-select/async"; // npm i react-select 필요
import widgetAPI from "../services/index.js";
export default function FiltersEditor({
  styles,
  filters,
  setFilters,
  getDimensionsForView,
  view,
}) {
  // 원본 UI처럼: any of / none of 만 노출
  const OPERATORS = [
    { value: "anyOf", label: "any of" }, // IN
    { value: "noneOf", label: "none of" }, // NOT_IN
  ];

  // 뷰별 컬럼 옵션 (기존 getDimensionsForView 사용)
  const DIMENSIONS = useMemo(
    () =>
      typeof getDimensionsForView === "function"
        ? getDimensionsForView(view) ?? []
        : [],
    [getDimensionsForView, view]
  );

  const update = (i, patch) =>
    setFilters(filters.map((f, idx) => (idx === i ? { ...f, ...patch } : f)));

  const add = () =>
    setFilters([
      ...filters,
      { column: "", operator: "anyOf", values: [] }, // 원본 포맷: values = []
    ]);

  const remove = (i) => setFilters(filters.filter((_, idx) => idx !== i));

  // 컬럼 값 목록을 서버에서 로드 (원본처럼 동적 로딩)
  const loadValueOptions = async (column, input) => {
    if (!column) return [];
    // widgetAPI에 맞게 구현되어 있어야 함:
    // getFilterValues({ view, column, search })
    const items = await widgetAPI.getFilterValues({
      view,
      column,
      search: input || "",
    });
    return (items || []).map((v) => ({ label: String(v), value: v }));
  };

  return (
    <div className={styles["config-section"]}>
      <div className={styles["section-header"]}>
        <h3>Filters</h3>
        <button className={styles["collapse-btn"]}>▲</button>
      </div>

      {filters.map((f, i) => {
        const columnSelected = !!f.column;

        return (
          <div key={i} className={styles["filter-row"]}>
            <span className={styles["filter-label"]}>Where</span>

            {/* Column */}
            <select
              className={styles["form-select"]}
              value={f.column ?? ""}
              onChange={(e) => {
                const col = e.target.value;
                // 컬럼 바꾸면 values 초기화
                update(i, { column: col, values: [] });
              }}
            >
              <option value="" disabled>
                Column
              </option>
              {DIMENSIONS.map((d) => (
                <option key={d.value} value={d.value}>
                  {d.label}
                </option>
              ))}
            </select>

            {/* Operator (any of / none of) */}
            <select
              className={styles["form-select"]}
              disabled={!columnSelected}
              value={!columnSelected ? "anyOf" : f.operator ?? "anyOf"}
              onChange={(e) => update(i, { operator: e.target.value })}
            >
              {OPERATORS.map((op) => (
                <option key={op.value} value={op.value}>
                  {op.label}
                </option>
              ))}
            </select>

            {/* Values: 원본처럼 멀티 선택 + 동적 옵션 */}
            <div style={{ minWidth: 260, flex: 1 }}>
              <AsyncSelect
                isMulti
                cacheOptions
                defaultOptions
                isDisabled={!columnSelected}
                loadOptions={(input) => loadValueOptions(f.column, input)}
                value={(f.values || []).map((v) => ({
                  label: String(v),
                  value: v,
                }))}
                onChange={(vals) =>
                  update(i, { values: (vals || []).map((x) => x.value) })
                }
                placeholder="Select"
              />
            </div>

            <button
              className={styles["remove-filter-btn"]}
              onClick={() => remove(i)}
              title="Remove"
              aria-label="Remove"
            >
              ×
            </button>
          </div>
        );
      })}

      <button className={styles["add-filter-btn"]} onClick={add}>
        + Add filter
      </button>
    </div>
  );
}
