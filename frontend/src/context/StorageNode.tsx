import React, { createContext, useContext, useState, useMemo } from 'react';

type StorageMap = { [key: string]: any };

interface StorageNodeContextType {
  storage: StorageMap;
  setStorageValue: (key: string, value: any) => void;
  getStorageValue: (key: string) => any;
  removeStorageValue: (key: string) => void;
  clearStorage: () => void;
}

const StorageNodeContext = createContext<StorageNodeContextType | null>(null);

export function StorageNodeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [storage, setStorage] = useState<StorageMap>({});

  const setStorageValue = (key: string, value: any) => {
    setStorage((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const getStorageValue = (key: string) => storage[key];

  const removeStorageValue = (key: string) => {
    setStorage((prev) => {
      const { [key]: removed, ...rest } = prev;
      return rest;
    });
  };

  const clearStorage = () => setStorage({});

  const value = useMemo(
    () => ({
      storage,
      setStorageValue,
      getStorageValue,
      removeStorageValue,
      clearStorage,
    }),
    [storage],
  );

  return (
    <StorageNodeContext.Provider value={value}>
      {children}
    </StorageNodeContext.Provider>
  );
}

export function useStorageNode() {
  const context = useContext(StorageNodeContext);
  if (!context) {
    throw new Error('useStorageNode must be used within a StorageNodeProvider');
  }
  return context;
}
