import { useState, useCallback } from 'react';

export interface TableHeaderState {
  searchValue: string;
  filterByCondition: boolean;
  filterByStatus: boolean;
  filterMenuOpen: boolean;
}

export interface TableHeaderActions {
  setSearchValue: (value: string) => void;
  setFilterByCondition: (value: boolean) => void;
  setFilterByStatus: (value: boolean) => void;
  setFilterMenuOpen: (value: boolean) => void;
  resetState: () => void;
}

export const useTableHeaderState = (initialState?: Partial<TableHeaderState>): [TableHeaderState, TableHeaderActions] => {
  const [state, setState] = useState<TableHeaderState>({
    searchValue: '',
    filterByCondition: false,
    filterByStatus: false,
    filterMenuOpen: false,
    ...initialState,
  });

  const setSearchValue = useCallback((value: string) => {
    setState(prev => ({ ...prev, searchValue: value }));
  }, []);

  const setFilterByCondition = useCallback((value: boolean) => {
    setState(prev => ({ ...prev, filterByCondition: value }));
  }, []);

  const setFilterByStatus = useCallback((value: boolean) => {
    setState(prev => ({ ...prev, filterByStatus: value }));
  }, []);

  const setFilterMenuOpen = useCallback((value: boolean) => {
    setState(prev => ({ ...prev, filterMenuOpen: value }));
  }, []);

  const resetState = useCallback(() => {
    setState({
      searchValue: '',
      filterByCondition: false,
      filterByStatus: false,
      filterMenuOpen: false,
    });
  }, []);

  return [
    state,
    {
      setSearchValue,
      setFilterByCondition,
      setFilterByStatus,
      setFilterMenuOpen,
      resetState,
    }
  ];
};

// Hook for managing multiple table header instances
export const useMultipleTableHeaders = () => {
  const [instances, setInstances] = useState<Record<string, TableHeaderState>>({});

  const getInstanceState = useCallback((instanceId: string): TableHeaderState => {
    return instances[instanceId] || {
      searchValue: '',
      filterByCondition: false,
      filterByStatus: false,
      filterMenuOpen: false,
    };
  }, [instances]);

  const updateInstanceState = useCallback((instanceId: string, updates: Partial<TableHeaderState>) => {
    setInstances(prev => ({
      ...prev,
      [instanceId]: {
        ...getInstanceState(instanceId),
        ...updates,
      },
    }));
  }, [getInstanceState]);

  const resetInstance = useCallback((instanceId: string) => {
    setInstances(prev => {
      const newInstances = { ...prev };
      delete newInstances[instanceId];
      return newInstances;
    });
  }, []);

  const resetAllInstances = useCallback(() => {
    setInstances({});
  }, []);

  return {
    getInstanceState,
    updateInstanceState,
    resetInstance,
    resetAllInstances,
    instances,
  };
}; 