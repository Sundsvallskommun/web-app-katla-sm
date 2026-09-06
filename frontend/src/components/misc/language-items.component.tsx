'use client';

import { DropdownMenuRadioGroup, DropdownMenuRadioItem } from '@astryxdesign/core/DropdownMenu';
import { languageOptions } from '@components/misc/language-options';
import { useTranslation } from 'react-i18next';
import { useLanguageSwitch } from 'src/hooks/use-language-switch';

interface LanguageItemsProps {
  /**
   * Unikt id för språkgruppen. Astryx äger markeringen per menygrupp; grupperna i
   * sidhuvudet och användarmenyn behåller ändå var sin identifierbar yta.
   */
  name?: string;
  /** Prefix för data-cy, av samma skäl som `name`: selektorerna måste vara unika per yta. */
  testIdPrefix?: string;
  /**
   * Körs precis före navigeringen, för sidor som har tillstånd att rädda undan. Språkbytet
   * monterar om trädet, så det som bara ligger i minnet är borta efter det.
   */
  onBeforeSwitch?: () => void;
}

export const LanguageItems: React.FC<LanguageItemsProps> = ({
  name = 'user-menu-language',
  testIdPrefix = 'language-option',
  onBeforeSwitch,
}) => {
  const { t } = useTranslation();
  const { currentLanguage, switchTo } = useLanguageSwitch();

  return (
    <DropdownMenuRadioGroup
      label={t('layout:language.label')}
      id={name}
      value={currentLanguage}
      hasCloseOnSelect={false}
      onChange={(value) => {
        onBeforeSwitch?.();
        switchTo(value);
      }}
    >
      {languageOptions.map(({ value, labelKey }) => (
        <DropdownMenuRadioItem
          key={value}
          value={value}
          data-cy={`${testIdPrefix}-${value}`}
          label={<span lang={value}>{t(labelKey)}</span>}
        />
      ))}
    </DropdownMenuRadioGroup>
  );
};
