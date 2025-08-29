import React from 'react';
import { CircleMinus , CirclePlus } from 'lucide-react';
import formStyles from './Form.module.css'; // 공통 스타일
import styles from './NewModelForm.module.css'; // 전용 스타일

const NewModelForm = ({ onSave, onCancel }) => {
    const [modelName, setModelName] = React.useState('');
    const [matchPattern, setMatchPattern] = React.useState('');
    const [prices, setPrices] = React.useState([
        {id: crypto.randomUUID(), usageType: 'input', price: '0.00001'},
        {id: crypto.randomUUID(), usageType: 'output', price: '0.00002'},
    ]);
    const [tokenizer, setTokenizer] = React.useState('none');

    // Price 리스트 관리 함수들
    const handlePriceChange = (id, field, value) => {
        setPrices(prices.map(p => p.id === id ? {...p, [field]: value} : p));
    };

    const addPriceRow = () => {
        setPrices([...prices, {id: crypto.randomUUID(), usageType: '', price: ''}]);
    };

    const removePriceRow = (id) => {
        setPrices(prices.filter(p => p.id !== id));
    };

    // 템플릿 버튼 핸들러
    const prefillTemplate = (template) => {
        if (template === 'openai') {
            setPrices([
                {id: crypto.randomUUID(), usageType: 'input', price: '0.000005'},
                {id: crypto.randomUUID(), usageType: 'output', price: '0.000015'},
            ]);
        } else {
            setPrices([
                {id: crypto.randomUUID(), usageType: 'input', price: '0.000008'},
                {id: crypto.randomUUID(), usageType: 'output', price: '0.000008'},
            ]);
        }
    }

    // 저장 핸들러
    const handleSave = () => {
        if (!modelName || !matchPattern) {
            alert('Model Name과 Match Pattern은 핈수 항목입니다.');
            return;
        }
        onSave({
            modelName,
            matchPattern,
            prices: prices.reduce((acc, p) => ({...acc, [p.usageType]: parseFloat(p.price) || 0}), {}),
            tokenizer,
        });
    };

    return (
        <div className={styles.formWrapper}>
            <div className={styles.formContent}>
                { /* --- 헤더 --- */ }
                <div className={styles.formHeader}>
                    <h3>Create Model</h3>
                    <p>Create a new model configuration to track generation costs.</p>
                </div>

                { /* --- Model Name --- */ }
                <div className={formStyles.formGroup}>
                    <label htmlFor="model-name" className = { formStyles.formLabel }>Model Name</label>
                    <p className={formStyles.description}>The name of the model. This will be used to reference the model in the API.</p>
                    <input id="model-name" type="text" value={modelName} onChange={(e) => setModelName(e.target.value)} className={styles.input}/>
                </div>

                { /* --- Match Pattern --- */ }
                <div className={formStyles.formGroup}>
                    <label htmlFor="match-pattern" className = { formStyles.formLabel }>Match pattern</label>
                    <p className={formStyles.description}>Regular expression (Postgres syntax)) to match ingested generations.</p>
                    <input id="match-pattern" type="text" value={matchPattern} onChange={(e) => setMatchPattern(e.target.value)} className={styles.input}/>
                </div>

                { /* --- Prices --- */ }
                <div className={formStyles.formGroup}>
                    <label className = { formStyles.formLabel }>Prices</label>
                    <p className={formStyles.description}>Set prices per usage type for this model.</p>
                    <div className={styles.templateButtons}>
                        <span>Prefill usage types from template:</span>
                        <button onClick={() => prefillTemplate('openai')} className={styles.templateButton}>OpenAI</button>
                        <button onClick={() => prefillTemplate('anthropic')} className={styles.templateButton}>Anthropic</button>
                    </div>

                    <div className = { styles.priceRowLabels }>
                        <label>Usage type</label>
                        <label>Price</label>
                    </div>

                    {prices.map((p) => (
                        <div key={p.id} className={styles.priceRow}>
                            <input type="text" value={ p.usageType } onChange={e => handlePriceChange(p.id, 'usageType', e.target.value)} placeholder="Usage type" className={styles.input}/>
                            <input type="text" value={p.price} onChange={e => handlePriceChange(p.id, 'price', e.target.value)} placeholder="Price" className={styles.input}/>
                            <button onClick={() => removePriceRow(p.id)} className={styles.deleteButton}><CircleMinus  size={16}/></button>
                        </div>
                    ))}
                    <button onClick = { addPriceRow } className = { styles.addButton }><CirclePlus size = { 16 } /> Add Price</button>
                </div>

                { /* --- Price Preview --- */ }
                <div className={styles.previewTable}>
                    <p>Price Preview</p>
                    <div className={styles.previewHeader}>
                        <span>Usage Type</span><span>per unit</span><span>per 1K</span><span>per 1M</span>
                    </div>
                    {prices.filter(p => p.usageType && p.price).map(p => (
                        <div key={p.id} className={styles.previewRow}>
                            <span>{p.usageType}</span>
                            <span>${parseFloat(p.price).toFixed(6)}</span>
                            <span>${(parseFloat(p.price) * 1000).toFixed(3)}</span>
                            <span>${(parseFloat(p.price) * 1000000).toFixed(0)}</span>
                        </div>
                    ))}
                </div>

                { /* --- Tokenizer --- */ }
                <div className={formStyles.formGroup}>
                    <label htmlFor="tokenizer" className = { formStyles.formLabel }>Tokenizer</label>
                    <select id="tokenizer" value={tokenizer} onChange={(e) => setTokenizer(e.target.value)} className={styles.select}>
                        <option value="none">None</option>
                        <option value="openai">openai</option>
                        <option value="google">google</option>
                        <option value="claude">claude</option>
                    </select>
                </div>
            </div>

            { /* --- Footer --- */ }
            <div className={styles.footer}>
                <button onClick={onCancel} className = { styles.cancelButton }>Cancel</button>
                <button onClick={handleSave} className= { styles.submitButton }>Submit</button>
            </div>
        </div>
    );
};

export default NewModelForm;
