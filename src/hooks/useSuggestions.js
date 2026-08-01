import { useState, useCallback, useEffect } from 'react';
import { fetchDailySuggestions, isValidDailySuggestions } from '../services/suggestionsApi';
import { FALLBACK_SUGGESTIONS } from '../lib/constants';

export function useSuggestions() {
  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Load suggestions
  const loadSuggestions = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await fetchDailySuggestions();

      if (data && isValidDailySuggestions(data)) {
        setSuggestions(data);
      } else {
        setSuggestions(FALLBACK_SUGGESTIONS);
      }
    } catch (error) {
      console.error('Error loading suggestions:', error);
      setSuggestions(FALLBACK_SUGGESTIONS);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load on mount
  useEffect(() => {
    loadSuggestions();
  }, [loadSuggestions]);

  return {
    suggestions,
    isLoading,
    loadSuggestions,
  };
}
