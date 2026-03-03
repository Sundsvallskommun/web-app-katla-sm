import { Moon, Monitor, Sun } from 'lucide-react';
import { ColorSchemeMode, PopupMenu, RadioButton } from '@sk-web-gui/react';
import { useLocalStorage } from '@utils/use-localstorage.hook';

export const ColorSchemeItems = () => {
const {colorScheme, setColorScheme} = useLocalStorage()

  return (
    <PopupMenu.Items>
      <PopupMenu.Item>
        <RadioButton
          value={'light'}
          onClick={() => {
            setColorScheme(ColorSchemeMode.Light);
          }}
          checked={colorScheme === 'light'}
        >
          Ljust <Sun className={colorScheme === 'light' ? '' : 'opacity-50'} />
        </RadioButton>
      </PopupMenu.Item>
      <PopupMenu.Item>
        <RadioButton
          value={'dark'}
          onClick={() => {
            setColorScheme(ColorSchemeMode.Dark);
          }}
          checked={colorScheme === 'dark'}
        >
          Mörkt <Moon className={colorScheme === 'dark' ? '' : 'opacity-50'} />
        </RadioButton>
      </PopupMenu.Item>
      <PopupMenu.Item>
        <RadioButton
          value={'system'}
          onClick={() => {
            setColorScheme(ColorSchemeMode.System);
          }}
          checked={colorScheme === 'system'}
        >
          System <Monitor className={colorScheme === 'system' ? '' : 'opacity-50'} />
        </RadioButton>
      </PopupMenu.Item>
    </PopupMenu.Items>
  );
};