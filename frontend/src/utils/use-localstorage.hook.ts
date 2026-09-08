import 'dotenv';

import { LocalStorage } from '@interfaces/localstorage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export const useLocalStorage = create(
  persist<LocalStorage>(
    (set) => ({
      colorScheme: 'system',
      setColorScheme: (colorScheme) => set(() => ({ colorScheme })),
    }),
    {
      name: `${process.env.NEXT_PUBLIC_APP_NAME}-localstorage-store`,
      storage: createJSONStorage(() => localStorage),
    }
  )
);
