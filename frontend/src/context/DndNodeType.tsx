import React, { createContext, useContext, useState, useMemo } from 'react';

interface DndNodeTypeContextType {
  dndNodeType: string | null;
  setDndNodeType: (type: string | null) => void;
}

const DndNodeTypeContext = createContext<DndNodeTypeContextType | null>(null);

export function DndNodeTypeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [dndNodeType, setDndNodeType] = useState<string | null>(null);

  const value = useMemo(() => ({ dndNodeType, setDndNodeType }), [dndNodeType]);

  return (
    <DndNodeTypeContext.Provider value={value}>
      {children}
    </DndNodeTypeContext.Provider>
  );
}

export function useDndNodeType() {
  const context = useContext(DndNodeTypeContext);
  if (!context) {
    throw new Error('useDndNodeType must be used within a DndNodeTypeProvider');
  }
  return context;
}
