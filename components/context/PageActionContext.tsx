import React, { createContext, useCallback, useContext, useState, type ReactNode } from 'react';

export type PageActionId = 'new-trip' | 'new-passenger';

interface PageActionContextType {
  pendingAction: PageActionId | null;
  navigateWithAction: (page: string, action: PageActionId) => void;
  clearAction: () => void;
}

const PageActionContext = createContext<PageActionContextType | undefined>(undefined);

interface PageActionProviderProps {
  children: ReactNode;
  onPageChange: (page: string) => void;
  initialPendingAction?: PageActionId | null;
}

export function PageActionProvider({
  children,
  onPageChange,
  initialPendingAction = null,
}: PageActionProviderProps) {
  const [pendingAction, setPendingAction] = useState<PageActionId | null>(initialPendingAction);

  const navigateWithAction = useCallback(
    (page: string, action: PageActionId) => {
      onPageChange(page);
      setPendingAction(action);
    },
    [onPageChange]
  );

  const clearAction = useCallback(() => {
    setPendingAction(null);
  }, []);

  return (
    <PageActionContext.Provider value={{ pendingAction, navigateWithAction, clearAction }}>
      {children}
    </PageActionContext.Provider>
  );
}

export function usePageAction() {
  const context = useContext(PageActionContext);
  if (!context) {
    throw new Error('usePageAction must be used within PageActionProvider');
  }
  return context;
}
