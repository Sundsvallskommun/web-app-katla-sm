import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SidebarStore {
  activeStatus: string | null;
  setActiveStatus: (status: string) => void;
}

export const useSidebarStore = create<SidebarStore>()(
  persist(
    (set) => ({
      activeStatus: null,
      setActiveStatus: (status) => set({ activeStatus: status }),
    }),
    {
      name: 'sidebar-storage',
    }
  )
);