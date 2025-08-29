import React, { useMemo } from 'react';
import styles from './CodeBlock.module.css';

const CodeBlock = ({ code }) => {
  const formattedCode = useMemo(() => {
    if (typeof code === 'string') return code;
    if (typeof code === 'object' && code !== null) return JSON.stringify(code, null, 2);
    return String(code ?? '');
  }, [code]);

  const lineCount = useMemo(() => formattedCode.split('\n').length, [formattedCode]);

  return (
    <div className={styles.container}>
      <div className={styles.lineNumbers}>
        {Array.from({ length: lineCount }, (_, i) => (
          <span key={i}>{i + 1}</span>
        ))}
      </div>
      <pre className={styles.code}>{formattedCode}</pre>
    </div>
  );
};

export default CodeBlock;