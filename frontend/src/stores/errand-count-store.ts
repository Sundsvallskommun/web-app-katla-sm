import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

interface ErrandCountState {
  openErrandCount: number;
  draftErrandCount: number;
  closedErrandCount: number;
  setOpenErrandCount: (count: number) => void;
  setDraftErrandCount: (count: number) => void;
  setClosedErrandCount: (count: number) => void;
}

export const useErrandCountStore = create<ErrandCountState>()(
  persist(
    (set) => ({
      openErrandCount: 0,
      draftErrandCount: 0,
      closedErrandCount: 0,
      setOpenErrandCount: (count) => set({ openErrandCount: count }),
      setDraftErrandCount: (count) => set({ draftErrandCount: count }),
      setClosedErrandCount: (count) => set({ closedErrandCount: count }),
    }),
    {
      name: 'errand-count-storage',
      storage: createJSONStorage(() => sessionStorage),
    }
  )
);
