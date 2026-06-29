import React, { useState } from 'react';
import { useProfilerContext, ProfilerReportData } from './ProfilerContext';

export const ProfilerReport: React.FC = () => {
  const { generateReport, clearData, isProfiling, setIsProfiling } = useProfilerContext();
  const [reportData, setReportData] = useState<ProfilerReportData[]>([]);

  const handleGenerate = () => {
    setReportData(generateReport());
  };

  const handleClear = () => {
    clearData();
    setReportData([]);
  };

  return (
    <div className="profiler-report" style={{ padding: '20px', border: '1px solid #ccc', margin: '20px 0' }}>
      <h2>Dashboard Component Lifecycle Profiler</h2>
      
      <div style={{ marginBottom: '15px' }}>
        <button onClick={() => setIsProfiling(!isProfiling)} style={{ marginRight: '10px' }}>
          {isProfiling ? 'Stop Profiling' : 'Start Profiling'}
        </button>
        <button onClick={handleGenerate} style={{ marginRight: '10px' }}>Generate Report</button>
        <button onClick={handleClear}>Clear Metrics</button>
      </div>

      {reportData.length > 0 && (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f5f5f5', textAlign: 'left' }}>
              <th style={{ padding: '8px', borderBottom: '2px solid #ddd' }}>Component</th>
              <th style={{ padding: '8px', borderBottom: '2px solid #ddd' }}>Renders</th>
              <th style={{ padding: '8px', borderBottom: '2px solid #ddd' }}>Total Time (ms)</th>
              <th style={{ padding: '8px', borderBottom: '2px solid #ddd' }}>Avg Time (ms)</th>
              <th style={{ padding: '8px', borderBottom: '2px solid #ddd' }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {reportData.map((data) => (
              <tr key={data.componentName} style={{ background: data.isInefficient ? '#ffebee' : 'transparent' }}>
                <td style={{ padding: '8px', borderBottom: '1px solid #ddd' }}>{data.componentName}</td>
                <td style={{ padding: '8px', borderBottom: '1px solid #ddd' }}>{data.renders}</td>
                <td style={{ padding: '8px', borderBottom: '1px solid #ddd' }}>{data.totalRenderTime.toFixed(2)}</td>
                <td style={{ padding: '8px', borderBottom: '1px solid #ddd' }}>{data.averageRenderTime.toFixed(2)}</td>
                <td style={{ padding: '8px', borderBottom: '1px solid #ddd' }}>
                  {data.isInefficient ? '⚠️ Inefficient' : '✅ Optimal'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      
      <div style={{ marginTop: '15px', fontSize: '0.9em', color: '#666' }}>
        <p><strong>Note:</strong> Highlighting occurs for components rendering &gt; 10 times or taking &gt; 16ms per render.</p>
      </div>
    </div>
  );
};
