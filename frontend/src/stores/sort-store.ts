import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type SortOrder = 'asc' | 'desc';

export interface SortState {
  sortColumn: string;
  sortOrder: SortOrder;
  page: number;
  size: number;
  rowHeight: string;
  setSort: (column: string) => void;
  setPage: (page: number) => void;
  setSize: (size: number) => void;
  setRowHeight: (rowHeight: string) => void;
  reset: () => void;
}

const DEFAULTS = {
  sortColumn: 'updated',
  sortOrder: 'desc' as SortOrder,
  page: 0,
  size: 12,
  rowHeight: 'normal',
};

export const useSorteStore = create<SortState>()(
  persist(
    (set, get) => ({
      sortColumn: DEFAULTS.sortColumn,
      sortOrder: DEFAULTS.sortOrder,
      page: DEFAULTS.page,
      size: DEFAULTS.size,
      rowHeight: DEFAULTS.rowHeight,
      setSort: (column: string) => {
        const { sortColumn, sortOrder } = get();
        if (sortColumn === column) {
          set({ sortOrder: sortOrder === 'asc' ? 'desc' : 'asc' });
        } else {
          set({ sortColumn: column, sortOrder: 'desc' });
        }
        set({ page: 0 });
      },
      setPage: (page: number) => set({ page }),
      setSize: (size: number) => {
        set({ size, page: 0 });
      },
      setRowHeight: (rowHeight: string) => set({ rowHeight }),
      reset: () => set({ ...DEFAULTS }),
    }),
    {
      name: 'sort-storage',
    }
  )
);
