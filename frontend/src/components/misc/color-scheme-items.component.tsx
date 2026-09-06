import { DropdownMenuRadioGroup, DropdownMenuRadioItem } from '@astryxdesign/core/DropdownMenu';
import { colorSchemeOptions } from '@components/misc/color-scheme-options';
import { useLocalStorage } from '@utils/use-localstorage.hook';
import { useTranslation } from 'react-i18next';

export const ColorSchemeItems = () => {
  const { colorScheme, setColorScheme } = useLocalStorage();
  const { t } = useTranslation();

  return (
    <DropdownMenuRadioGroup
      label={t('layout:color_scheme.label')}
      id="user-menu-color-scheme"
      value={colorScheme}
      hasCloseOnSelect={false}
      onChange={(value) => {
        const option = colorSchemeOptions.find((candidate) => {
          const optionValue: string = candidate.value;
          return optionValue === value;
        });
        if (option) setColorScheme(option.value);
      }}
    >
      {colorSchemeOptions.map(({ value, labelKey, icon: Icon }) => (
        <DropdownMenuRadioItem
          key={value}
          value={value}
          label={t(labelKey)}
          icon={<Icon aria-hidden="true" size={18} />}
        />
      ))}
    </DropdownMenuRadioGroup>
  );
};
