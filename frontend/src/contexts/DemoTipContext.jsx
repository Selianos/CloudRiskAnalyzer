import React, { createContext, useContext, useState } from 'react';

const DemoTipContext = createContext(null);

export function DemoTipProvider({ children }) {
  const [page, setPage] = useState('form');
  const [selectedNode, setSelectedNode] = useState(null);
  const [activeFinding, setActiveFinding] = useState(null);

  return (
    <DemoTipContext.Provider
      value={{
        page,
        setPage,
        selectedNode,
        setSelectedNode,
        activeFinding,
        setActiveFinding,
      }}
    >
      {children}
    </DemoTipContext.Provider>
  );
}

export function useDemoTip() {
  const context = useContext(DemoTipContext);
  if (!context) {
    return {
      page: 'form',
      setPage: () => {},
      selectedNode: null,
      setSelectedNode: () => {},
      activeFinding: null,
      setActiveFinding: () => {},
    };
  }
  return context;
}

