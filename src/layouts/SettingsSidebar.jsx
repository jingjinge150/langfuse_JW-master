import React from 'react';
import { NavLink, useParams } from 'react-router-dom';
import styles from './SettingsSidebar.module.css';

const SettingsSidebar = () => {
    const { projectId } = useParams();

    const getPath = (path) => {
        if (!projectId) return `/settings/${ path }`;
        return `/projects/${ projectId }/settings/${ path }`;
    }

    return (
        <nav className = { styles.nav }>
            <ul>
                <li><NavLink to = { getPath('') } end>General</NavLink></li>
                <li><NavLink to = { getPath('api-keys') }>API Keys</NavLink></li>
                <li><NavLink to = { getPath('llm-connections') }>LLM Connections</NavLink></li>
                <li><NavLink to = { getPath('models') }>Models</NavLink></li>
                <li><NavLink to = { getPath('scores') }>Scores / Evaluation</NavLink></li>
                <li><NavLink to = { getPath('members') }>Members</NavLink></li>
            </ul>
        </nav>
    );
};

export default SettingsSidebar;
