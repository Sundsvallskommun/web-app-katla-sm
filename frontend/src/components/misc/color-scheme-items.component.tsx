import LucideIcon from '@sk-web-gui/lucide-icon';
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
          Ljust <LucideIcon name="sun" className={colorScheme === 'light' ? '' : 'opacity-50'} />
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
          Mörkt <LucideIcon name="moon" className={colorScheme === 'dark' ? '' : 'opacity-50'} />
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
          System <LucideIcon name="monitor" className={colorScheme === 'system' ? '' : 'opacity-50'} />
        </RadioButton>
      </PopupMenu.Item>
    </PopupMenu.Items>
  );
};