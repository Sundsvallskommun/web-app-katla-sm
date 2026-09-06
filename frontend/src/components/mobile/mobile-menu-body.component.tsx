'use client';

import { Avatar } from '@astryxdesign/core/Avatar';
import { Button } from '@astryxdesign/core/Button';
import { Dialog } from '@astryxdesign/core/Dialog';
import { useFocusTrap } from '@astryxdesign/core/hooks';
import { RadioList, RadioListItem } from '@astryxdesign/core/RadioList';
import { LogoutButton } from '@components/buttons/logout-button.component';
import { colorSchemeOptions } from '@components/misc/color-scheme-options';
import { languageOptions } from '@components/misc/language-options';
import { OverviewStatusNav } from '@components/sidebars/overview-status-nav.component';
import { useUserStore } from '@services/user-service/user-service';
import { useLocalStorage } from '@utils/use-localstorage.hook';
import { X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useLanguageSwitch } from 'src/hooks/use-language-switch';
import { useShallow } from 'zustand/react/shallow';

import { MainPageMobileHeader } from './main-page-mobile-header.component';

interface MobileMenuBodyProps {
  show?: boolean;
  onClose: () => void;
}

export const MobileMenuBody: React.FC<MobileMenuBodyProps> = ({ show = true, onClose }) => {
  const { t } = useTranslation();
  const user = useUserStore(useShallow((s) => s.user));
  const { colorScheme, setColorScheme } = useLocalStorage();
  const { currentLanguage, switchTo } = useLanguageSwitch();
  const { containerRef } = useFocusTrap<HTMLDialogElement>({ isActive: show });

  return (
    <Dialog
      ref={containerRef}
      id="mobile-overview-menu"
      isOpen={show}
      onOpenChange={(isOpen) => {
        if (!isOpen) onClose();
      }}
      aria-label={t('filtering:menu_title')}
      variant="fullscreen"
      purpose="form"
      padding={0}
    >
      <MainPageMobileHeader
        actions={
          <Button
            data-autofocus
            isIconOnly
            variant="ghost"
            label={t('layout:controls.close_menu')}
            icon={<X aria-hidden="true" size={20} />}
            onClick={onClose}
          />
        }
      >
        <div className="flex flex-col gap-6 px-6 py-6">
          <div className="flex items-center gap-3">
            <Avatar name={user.name} size={40} tooltip={false} />
            <div className="flex min-w-0 flex-col">
              <span className="break-words font-bold text-base">{user.name}</span>
              <span className="break-words text-sm text-muted">{user.username}</span>
            </div>
          </div>

          <div className="border-y border-default py-4">
            <OverviewStatusNav />
          </div>

          <RadioList
            label={t('layout:color_scheme.label')}
            htmlName="mobile-color-scheme"
            value={colorScheme}
            onChange={(value) => {
              const option = colorSchemeOptions.find((candidate) => {
                const optionValue: string = candidate.value;
                return optionValue === value;
              });
              if (option) setColorScheme(option.value);
            }}
          >
            {colorSchemeOptions.map(({ value, labelKey, icon: Icon }) => (
              <RadioListItem
                key={value}
                value={value}
                label={t(labelKey)}
                endContent={<Icon aria-hidden="true" size={18} />}
              />
            ))}
          </RadioList>

          <RadioList
            label={t('layout:language.label')}
            htmlName="mobile-language"
            value={currentLanguage}
            onChange={switchTo}
          >
            {languageOptions.map(({ value, labelKey }) => (
              <div key={value} lang={value}>
                <RadioListItem value={value} data-cy={`mobile-language-option-${value}`} label={t(labelKey)} />
              </div>
            ))}
          </RadioList>

          <div className="border-t border-default pt-4">
            <LogoutButton smallSideBar={false} />
          </div>
        </div>
      </MainPageMobileHeader>
    </Dialog>
  );
};
