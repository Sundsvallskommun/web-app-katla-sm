import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface FilterState {
  activeStatus: string | null;
  statuses: string[];
  categories: string[];
  startDate: string;
  endDate: string;
  queries: string[];
  setActiveStatus: (status: string) => void;
  setStatuses: (statuses: string[]) => void;
  setCategories: (categories: string[]) => void;
  setStartDate: (date: string) => void;
  setEndDate: (date: string) => void;
  setQueries: (queries: string[]) => void;
  addQuery: (query: string) => void;
  removeQuery: (query: string) => void;
  resetFilters: () => void;
}

export const useFilterStore = create<FilterState>()(
  persist(
    (set) => ({
      activeStatus: null,
      statuses: [],
      categories: [],
      startDate: '',
      endDate: '',
      queries: [],
      setActiveStatus: (status) => set({ activeStatus: status }),
      setStatuses: (statuses) => set({ statuses }),
      setCategories: (categories) => set({ categories }),
      setStartDate: (startDate) => set({ startDate }),
      setEndDate: (endDate) => set({ endDate }),
      setQueries: (queries) => set({ queries }),
      addQuery: (query) =>
        set((state) => {
          const trimmed = query.trim();
          if (!trimmed || state.queries.includes(trimmed)) return state;
          return { queries: [...state.queries, trimmed] };
        }),
      removeQuery: (query) => set((state) => ({ queries: state.queries.filter((q) => q !== query) })),
      resetFilters: () =>
        set({
          categories: [],
          startDate: '',
          endDate: '',
          queries: [],
        }),
    }),
    {
      name: 'filter-storage',
    }
  )
);
