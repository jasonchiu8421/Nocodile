"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";

interface ProcessingContextType {
  isProcessing: boolean;
  setIsProcessing: (value: boolean) => void;
}

const ProcessingContext = createContext<ProcessingContextType | undefined>(undefined);

export const useProcessingContext = () => {
  const context = useContext(ProcessingContext);
  if (!context) {
    // 如果沒有 Provider，返回默認值（不拋出錯誤，以便在沒有 Provider 時也能使用）
    return { isProcessing: false, setIsProcessing: () => {} };
  }
  return context;
};

interface ProcessingProviderProps {
  children: ReactNode;
}

export const ProcessingProvider: React.FC<ProcessingProviderProps> = ({ children }) => {
  const [isProcessing, setIsProcessing] = useState(false);

  const value: ProcessingContextType = {
    isProcessing,
    setIsProcessing,
  };

  return (
    <ProcessingContext.Provider value={value}>
      {children}
    </ProcessingContext.Provider>
  );
};

