// BigNumberChart.jsx
import React from "react";
import PropTypes from "prop-types";
import styles from "./BigNumberChart.module.css";

function BigNumberChart({ value, unit, label }) {
  const formatValue = (val) => {
    if (typeof val === "number") {
      return val.toLocaleString();
    }
    return val;
  };

  return (
    <div className={styles.container}>
      <div className={styles.value}>
        <span>{formatValue(value)}</span>
        {unit && <span className={styles.unit}>{unit}</span>}
      </div>
      {label && <div className={styles.label}>{label}</div>}
    </div>
  );
}

BigNumberChart.propTypes = {
  value: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
  unit: PropTypes.string,
  label: PropTypes.string,
};

export default BigNumberChart;
