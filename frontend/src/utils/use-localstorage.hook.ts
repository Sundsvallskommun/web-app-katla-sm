import 'dotenv';

import { LocalStorage } from '@interfaces/localstorage';
import { applicationStorageScope } from 'src/config/appconfig';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export const useLocalStorage = create(
  persist<LocalStorage>(
    (set) => ({
      colorScheme: 'system',
      setColorScheme: (colorScheme) => set(() => ({ colorScheme })),
    }),
    {
      name: `${applicationStorageScope}:preferences`,
      storage: createJSONStorage(() => localStorage),
    }
  )
);
