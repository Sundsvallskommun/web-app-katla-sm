'use client';

import { DropdownMenu } from '@astryxdesign/core/DropdownMenu';
import { LanguageItems } from '@components/misc/language-items.component';
import { Languages } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useLanguageSwitch } from 'src/hooks/use-language-switch';

/** Keep language selection discoverable, including while completing a report. */
interface LanguageSwitchButtonProps {
  /** Se `LanguageItems`: sidor med tillstånd i minnet får rädda undan det före navigeringen. */
  onBeforeSwitch?: () => void;
}

export const LanguageSwitchButton: React.FC<LanguageSwitchButtonProps> = ({ onBeforeSwitch }) => {
  const { t } = useTranslation();
  const { currentLanguage } = useLanguageSwitch();

  return (
    <DropdownMenu
      alignment="end"
      hasChevron={false}
      button={{
        label: t('layout:language.switch', { language: t(`layout:language.${currentLanguage}`) }),
        variant: 'ghost',
        size: 'lg',
        'data-cy': 'language-switch-button',
        icon: <Languages aria-hidden="true" size={18} />,
        children: <span aria-hidden="true">{currentLanguage.toLocaleUpperCase(currentLanguage)}</span>,
      }}
    >
      <LanguageItems name="header-language" testIdPrefix="header-language-option" onBeforeSwitch={onBeforeSwitch} />
    </DropdownMenu>
  );
};
