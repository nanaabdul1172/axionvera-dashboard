import React, { createContext, useContext, useEffect, useState } from 'react';
import { generateProfilingReport, getMetrics, clearMetrics } from '../utils/profilerUtils';

export interface ProfilerReportData {
  componentName: string;
  renders: number;
  totalRenderTime: number;
  averageRenderTime: number;
  isInefficient: boolean;
}

interface ProfilerContextType {
  isProfiling: boolean;
  setIsProfiling: (val: boolean) => void;
  generateReport: () => ProfilerReportData[];
  clearData: () => void;
}

const ProfilerContext = createContext<ProfilerContextType>({
  isProfiling: false,
  setIsProfiling: () => {},
  generateReport: () => [],
  clearData: () => {},
});

export const ProfilerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isProfiling, setIsProfiling] = useState(false);

  const generateReport = () => {
    return generateProfilingReport();
  };

  const clearData = () => {
    clearMetrics();
  };

  return (
    <ProfilerContext.Provider value={{ isProfiling, setIsProfiling, generateReport, clearData }}>
      {children}
    </ProfilerContext.Provider>
  );
};

export const useProfilerContext = () => useContext(ProfilerContext);
