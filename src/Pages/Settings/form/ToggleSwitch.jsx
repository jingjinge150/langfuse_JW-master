import React from 'react';
import styles from './ToggleSwitch.module.css';

const ToggleSwitch = ({ checked, onChange }) => {
    const handleChange = () => {
        onChange(!checked);
    };

    return (
        <label className = { styles.switch }>
            <input type = "checkbox" checked = { checked } onChange = { handleChange } />
            <span className = { `${ styles.slider } ${ styles.round }`}></span>
        </label>
    );
};

export default ToggleSwitch;
