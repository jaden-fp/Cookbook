import { createContext, useContext, useState, useCallback } from 'react';

interface FABContextValue {
  action: (() => void) | null;
  setAction: (fn: (() => void) | null) => void;
}

const FABContext = createContext<FABContextValue>({ action: null, setAction: () => {} });

export function FABProvider({ children }: { children: React.ReactNode }) {
  const [action, setActionState] = useState<(() => void) | null>(null);

  const setAction = useCallback((fn: (() => void) | null) => {
    setActionState(() => fn);
  }, []);

  return (
    <FABContext.Provider value={{ action, setAction }}>
      {children}
    </FABContext.Provider>
  );
}

export function useFAB() {
  return useContext(FABContext);
}
