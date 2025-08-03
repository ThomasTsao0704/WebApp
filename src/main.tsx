import React from 'react';
import ReactDOM from 'react-dom/client';
import DataTableViewer from './DataTableViewer';
import './index.css'; // 若有 Tailwind 或 CSS

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <DataTableViewer />
    </React.StrictMode>
);
