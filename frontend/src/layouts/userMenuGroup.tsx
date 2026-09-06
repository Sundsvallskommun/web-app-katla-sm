import { DropdownMenuSubMenu } from '@astryxdesign/core/DropdownMenu';
import { LogoutButton } from '@components/buttons/logout-button.component';
import { ColorSchemeItems } from '@components/misc/color-scheme-items.component';
import { LanguageItems } from '@components/misc/language-items.component';
import type { TFunction } from 'i18next';
import { Languages, Monitor } from 'lucide-react';
import type { ReactNode } from 'react';

interface UserMenuOptions {
  /** Both language controls preserve the same form state before navigating. */
  onBeforeLanguageSwitch?: () => void;
}

export interface UserMenuGroup {
  label: string;
  elements: { label: string; element: () => ReactNode }[];
}

export const createUserMenuGroups = (t: TFunction, options: UserMenuOptions = {}): UserMenuGroup[] => [
  {
    label: t('layout:controls.open_user_menu'),
    elements: [
      {
        label: t('layout:language.label'),
        element: () => (
          <DropdownMenuSubMenu
            label={<span data-cy="language-menu-button">{t('layout:language.label')}</span>}
            icon={<Languages aria-hidden="true" size={18} />}
          >
            <LanguageItems onBeforeSwitch={options.onBeforeLanguageSwitch} />
          </DropdownMenuSubMenu>
        ),
      },
      {
        label: t('layout:color_scheme.label'),
        element: () => (
          <DropdownMenuSubMenu label={t('layout:color_scheme.label')} icon={<Monitor aria-hidden="true" size={18} />}>
            <ColorSchemeItems />
          </DropdownMenuSubMenu>
        ),
      },
      {
        label: t('common:logout'),
        element: () => <LogoutButton inMenu testId="user-menu-logout-button" />,
      },
    ],
  },
];
