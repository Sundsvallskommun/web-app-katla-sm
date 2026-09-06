export type ColorSchemeMode = 'light' | 'dark' | 'system';

export type TableProperty = string;

export interface LocalStorage {
  colorScheme: ColorSchemeMode;
  setColorScheme: (color: ColorSchemeMode) => void;
}
