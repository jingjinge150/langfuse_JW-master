import React, { useState } from 'react';
import commonStyles from '../layout/SettingsCommon.module.css';
import formStyles from './Form.module.css';

const NewScoreForm = ({ onClose }) => {
    const [name, setName] = useState('');
    const [dataType, setDataType] = useState('NUMERIC');
    const [minValue, setMinValue] = useState('');
    const [maxValue, setMaxValue] = useState('');
    const [description, setDescription] = useState('');

    const handleSubmit = (event) => {
        event.preventDefault();
        const formData = { name, dataType, minValue, maxValue, description };
        console.log("Form Submitted:", formData);
        onClose();
    };

    return (
        <div className = { formStyles.formContainer }>
            {/* form */}
            <form onSubmit = { handleSubmit }>
                <div className = { formStyles.formBody }>
                    { /* name */}
                    <div className = { formStyles.formGroup }>
                        <label htmlFor = "name" className = { formStyles.formLabel }>Name</label>
                        <input
                            type = "text"
                            id = "name"
                            value = { name }
                            onChange = { (e) => setName(e.target.value) }
                            className = { formStyles.formInput }
                            required
                        />
                    </div>

                    {/* Data Type */}
                    <div className = { formStyles.formGroup }>
                        <label htmlFor = "dataType" className = { formStyles.formLabel }>Data type</label>
                        <select
                            id = "dataType"
                            value = { dataType }
                            onChange = { (e) => setDataType(e.target.value) }
                            className = { formStyles.formSelect }
                        >
                            <option value = "NUMERIC">NUMERIC</option>
                            <option value = "CATEGORICAL">CATEGORICAL</option>
                            <option value = "BOOLEAN">BOOLEAN</option>
                        </select>
                    </div>

                    {/* Minimum */}
                    <div className = { formStyles.formGroup }>
                        <label htmlFor = "minValue" className = { formStyles.formLabel }>Minimum (optional)</label>
                        <input
                            type = "number"
                            id = "minValue"
                            value = { minValue }
                            onChange = { (e) => setMinValue(e.target.value) }
                            className = { formStyles.formInput }
                        />
                    </div>

                    {/* Maximum */}
                    <div className = { formStyles.formGroup }>
                        <label htmlFor = "maxValue" className = { formStyles.formLabel }>Maximum (optional)</label>
                        <input
                            type = "number"
                            id = "maxValue"
                            value = { maxValue }
                            onChange = { (e) => setMaxValue(e.target.value) }
                            className = { formStyles.formInput }
                        />
                    </div>

                    {/* Description */}
                    <div className = { formStyles.formGroup }>
                        <label htmlFor = "description" className = { formStyles.formLabel }>Description (optional)</label>
                        <textarea
                            id = "description"
                            value = { description }
                            onChange = { (e) => setDescription(e.target.value) }
                            className = { formStyles.formTextarea }
                            placeholder = "Provide an optional description of the score config..."
                            rows = { 4 }
                        />
                    </div>
                </div>

                {/* form footer */}
                <footer className = {formStyles.formFooter }>
                    <button type = "submit" className = { commonStyles.button } style = {{ width: '100%'}}>
                        Submit
                    </button>
                </footer>
            </form>
        </div>
    );
};

export default NewScoreForm;
