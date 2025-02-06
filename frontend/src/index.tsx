import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router';
import { App, ConfigProvider, theme } from 'antd';
import { ReactFlowProvider } from '@xyflow/react';
import Home from './routes/Home';
import Project from './routes/Project';
import { ThemeProvider, useTheme } from './context/Theme';
import './index.css';

function Root() {
  const { isDarkTheme } = useTheme();

  return (
    <ReactFlowProvider>
      <ConfigProvider
        theme={{
          algorithm: isDarkTheme ? theme.darkAlgorithm : theme.defaultAlgorithm,
          token: {
            colorPrimary: '#4F46E5',
          },
        }}
      >
        <App>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Navigate to="/home" replace />} />
              <Route path="/home" element={<Home />} />
              <Route path="/project/:id" element={<Project />} />
            </Routes>
          </BrowserRouter>
        </App>
      </ConfigProvider>
    </ReactFlowProvider>
  );
}

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement,
);
root.render(
  <ThemeProvider>
    <Root />
  </ThemeProvider>,
);
