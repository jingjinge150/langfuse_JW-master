import React, { useState } from 'react';
import { Plus, X } from 'lucide-react';
import formStyles from './Form.module.css'; // 공통 스타일
import styles from './NewLLMConnectionForm.module.css'; // 전용 스타일
import ToggleSwitch from "./ToggleSwitch.jsx";

const NewLLMConnectionForm = ({ onSave }) => {
    //기본 설정 상태
    const [adapter, setAdapter] = useState('openai');
    const [provider, setProvider] = useState('');
    const [apiKey, setApiKey] = useState('');

    //고급 설정 상태
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [baseUrl, setBaseUrl] = useState('');
    const [extraHeaders, setExtraHeaders] = useState([]);
    const [enableDefaultModels, setEnableDefaultModels] = useState(true);
    const [customModels, setCustomModels] = useState([]);

    // 동적 리스트 아이템 추가/삭제/수정 핸들러
    const handleListChange = (
        list,
        setList,
        id,
        field,
        value
    ) => {
        setList(list.map(item => item.id === id ? { ...item, [field]: value } : item));
    };

    const addListItem = (setList, newItem) => {
        setList(prev => [...prev, newItem]);
    };

    const removeListItem = (list, setList, id) => {
        setList(list.filter(item => item.id !== id));
    };

    const handleSave = () => {
        if (!provider || !apiKey) {
            alert('Provider name과 API Key는 필수 항목입니다.');
            return;
        }
        const connectionData = {
            adapter,
            provider,
            apiKey,
        };
        
        if (showAdvanced) {
            connectionData.baseUrl = baseUrl;
            connectionData.enableDefaultModels = enableDefaultModels;
            
            connectionData.extraHeaders = extraHeaders
                .filter(h => h.key && h.value)
                .reduce((acc, curr) => {
                    acc[curr.key] = curr.value;
                    return acc;
                }, {});

            connectionData.customModels = customModels
                .filter(m => m.name)
                .map(m => m.name);
        }

        onSave(connectionData);
    }

    return (
        <div className = { formStyles.formWrapper }>
            { /* --- 기본 설정 --- */ }
            <div className = { formStyles.formGroup }>
                <label htmlFor = "llm-adapter" className = { formStyles.formLabel }>LLM adapter</label>
                <p className = { formStyles.description }>Schema that is accepted at that provider endpoint.</p>
                <select id = "llm-adapter" value = { adapter } onChange = { (e) => setAdapter(e.target.value) } className = { styles.select }>
                    <option value = "openai">openai</option>
                    <option value = "anthropic">anthropic</option>
                    <option value = "azure">azure</option>
                    <option value = "bedrock">bedrock</option>
                    <option value = "google-vertex-ai">google-vertex-ai</option>
                    <option value = "google-ai-studio">google-ai-studio</option>
                    <option value = "custom">custom</option>
                </select>
            </div>

            <div className = { formStyles.formGroup }>
                <label htmlFor = "provider-name" className = { formStyles.formLabel }>Provider name</label>
                <p className = { formStyles.description }>Key to identify the connection within Langfuse.</p>
                <input
                    id = "provider-name"
                    type = "text"
                    value = { provider }
                    onChange = { (e) => setProvider(e.target.value) }
                    placeholder = "e.g. openai"
                    className = { formStyles.formInput }
                />
            </div>

            <div className = { formStyles.formGroup }>
                <label htmlFor = "api-key" className = { formStyles.formLabel }>API Key</label>
                <p className = { formStyles.description }>Your API keys are stored encrypted on our servers.</p>
                <input
                    id = "api-key"
                    type = "password"
                    value = { apiKey }
                    onChange = { (e) => setApiKey(e.target.value) }
                    placeholder = "sk-..."
                    className = { formStyles.formInput }
                />
            </div>

            { /* --- 고급 설정 토글 --- */ }
            <div className = { styles.advancedToggle } onClick = { () => setShowAdvanced(!showAdvanced) }>
                Show advanced settings { showAdvanced ? '▲' : '▼' }
            </div>

            { /* --- 고급 설정 섹션 --- */}
            { showAdvanced && (
                <div className = { styles.advancedSection }>
                    <div className = { styles.divider }></div>

                    { /* API Base URL */ }
                    <div className = { formStyles.formGroup }>
                        <label htmlFor = "base-url" className = { formStyles.formLabel }>Base URL (optional)</label>
                        <p className = { formStyles.description}>
                            Leave blank to use the default base URL for the given LLM adapter. OpenAI default: https://api.openai.com/v1
                        </p>
                        <input
                            id = "base-url"
                            type = "text"
                            value = { baseUrl }
                            onChange = { (e) => setBaseUrl(e.target.value) }
                            placeholder = "https://api.openai.com/v1"
                            className = { formStyles.formInput }
                        />
                    </div>

                    { /* Extra Headers */ }
                    <div className = { formStyles.formGroup }>
                        <label className = { formStyles.formLabel }>Extra Headers</label>
                        <p className = { formStyles.description }>Optional additional HTTP headers to include with requests towards LLM provider. All header values stored encrypted on our servers.</p>
                        { extraHeaders.map(header => (
                            <div key = { header.id } className = { styles.listItem }>
                                <input type = "text" placeholder = "Key" value = { header.key } onChange = { e => handleListChange(extraHeaders, setExtraHeaders, header.id, 'key', e.target.value) } className = { styles.listInput } />
                                <input type = "text" placeholder = "Value" value = { header.value } onChange = { e => handleListChange(extraHeaders, setExtraHeaders, header.id, 'value', e.target.value) } className = { styles.listInput } />
                                <button onClick = { () => removeListItem(extraHeaders, setExtraHeaders, header.id) } className = { styles.deleteButton }><X size = { 16 } /></button>
                            </div>
                        ))}
                        <button onClick = { () => addListItem(setExtraHeaders, { id: crypto.randomUUID(), key: '', value: '' })} className = { styles.addButton} ><Plus size = { 16 } /> Add Header</button>
                    </div>

                    { /* Enable default models */ }
                    <div className = { `${ formStyles.formGroup } ${ styles.toggleGroup }` }>
                        <div>
                            <label className = { formStyles.formLabel }>Enable default models</label>
                            <p className = { formStyles.description }>Default models for the selected adapter will be available in Langfuse features.</p>
                        </div>
                        <ToggleSwitch checked = { enableDefaultModels } onChange = { setEnableDefaultModels } />
                    </div>

                    { /* Custom models */ }
                    <div className = { formStyles.formGroup }>
                        <label className = { formStyles.formLabel }>Custom models</label>
                        <p className = { formStyles.description }>Custom model names accepted by given endpoint.</p>
                        { customModels.map(model => (
                            <div key = { model.id } className = { styles.listItem }>
                                <input type = "text" placeholder = "Model name" value = { model.name } onChange = { e => handleListChange(customModels, setCustomModels, model.id, 'name', e.target.value) } className = { styles.listInputFull} />
                                <button onClick = { () => removeListItem(customModels, setCustomModels, model.id) } className = { styles.deleteButton }><X size = { 16 } /></button>
                            </div>
                        ))}
                        <button onClick = { () => addListItem(setCustomModels, { id: crypto.randomUUID(), name: ''})} className = { styles.addButton }><Plus size = { 16 } /> Add custom model name</button>
                    </div>
                </div>
            )}

            { /* --- Footer --- */}
            <div className = { formStyles.formFooter }>
                <button onClick = { handleSave } className = { styles.createButton }>
                    Create connection
                </button>
            </div>
        </div>
    );
};

export default NewLLMConnectionForm;
