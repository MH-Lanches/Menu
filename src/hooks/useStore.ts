import { useState, useEffect } from 'react';
import { initialState, AppState } from '../types/store';

const STORAGE_KEY = 'delivery_ecosystem_data';

export function useStore() {
  const [state, setState] = useState<AppState>(initialState);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setState(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse stored state", e);
      }
    }
    setIsLoaded(true);
  }, []);

  // Save to localStorage whenever state changes
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }
  }, [state, isLoaded]);

  const updateState = (updater: (prevState: AppState) => AppState) => {
    setState(prev => updater(prev));
  };

  const setStateDirectly = (newState: AppState) => {
    setState(newState);
  };

  return { state, updateState, setStateDirectly, isLoaded };
}
