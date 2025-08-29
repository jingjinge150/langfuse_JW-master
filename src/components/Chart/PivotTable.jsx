// PivotTable.jsx (수정된 버전)
import React from "react";
import PropTypes from "prop-types";
import styles from "./PivotTableChart.module.css";

function PivotTable({ data, rows, cols, value }) {
  if (!data || data.length === 0) {
    return (
      <div className={styles.tableContainer}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            height: "100%",
          }}
        >
          데이터가 없습니다
        </div>
      </div>
    );
  }

  // 피벗 데이터: rowKey -> (colKey -> number)
  const pivotData = new Map();
  const rowHeaders = new Set();
  const colHeaders = new Set();

  data.forEach((item) => {
    const rowKey = (rows || []).map((key) => item?.[key] || "").join(" / ");
    const colKey = (cols || []).map((key) => item?.[key] || "").join(" / ");

    rowHeaders.add(rowKey);
    colHeaders.add(colKey);

    if (!pivotData.has(rowKey)) {
      pivotData.set(rowKey, new Map());
    }

    const currentCol = pivotData.get(rowKey);
    const currentValue = currentCol.get(colKey) || 0;
    currentCol.set(colKey, currentValue + (Number(item?.[value]) || 0));
  });

  const sortedRowHeaders = Array.from(rowHeaders).sort();
  const sortedColHeaders = Array.from(colHeaders).sort();

  return (
    <div className={styles.tableContainer}>
      <table className={styles.pivotTable}>
        <thead>
          <tr>
            <th className={styles.headerCell}>
              {rows?.join(" / ")} \ {cols?.join(" / ")}
            </th>
            {sortedColHeaders.map((colHeader) => (
              <th key={colHeader} className={styles.headerCell}>
                {colHeader}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sortedRowHeaders.map((rowHeader) => (
            <tr key={rowHeader}>
              <td className={styles.rowHeaderCell}>{rowHeader}</td>
              {sortedColHeaders.map((colHeader) => {
                const cellValue = pivotData.get(rowHeader)?.get(colHeader) || 0;
                return (
                  <td key={colHeader} className={styles.dataCell}>
                    {cellValue.toLocaleString()}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

PivotTable.propTypes = {
  data: PropTypes.arrayOf(PropTypes.object).isRequired,
  rows: PropTypes.arrayOf(PropTypes.string).isRequired,
  cols: PropTypes.arrayOf(PropTypes.string).isRequired,
  value: PropTypes.string.isRequired,
};

export default PivotTable;
