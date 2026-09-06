'use client';

import { Avatar } from '@astryxdesign/core/Avatar';
import type { ButtonSize } from '@astryxdesign/core/Button';
import { DropdownMenu, DropdownMenuDivider } from '@astryxdesign/core/DropdownMenu';
import type { UserMenuGroup } from '@layouts/userMenuGroup';
import { forwardRef, type HTMLAttributes, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

interface AppUserMenuProps extends HTMLAttributes<HTMLDivElement> {
  buttonLabel?: string;
  buttonIcon?: ReactNode;
  buttonSize?: ButtonSize;
  initials?: string;
  menuTitle?: string;
  menuSubTitle?: string;
  menuGroups: UserMenuGroup[];
}

export const AppUserMenu = forwardRef<HTMLDivElement, AppUserMenuProps>((props, ref) => {
  const { t } = useTranslation();
  const {
    buttonLabel = t('layout:controls.open_user_menu'),
    buttonIcon,
    buttonSize = 'lg',
    className,
    initials,
    menuGroups,
    menuSubTitle,
    menuTitle,
    ...rest
  } = props;

  return (
    <div ref={ref} className={className} {...rest}>
      <DropdownMenu
        alignment="end"
        menuWidth={280}
        hasChevron={false}
        button={{
          label: buttonLabel,
          size: buttonSize,
          variant: 'ghost',
          isIconOnly: true,
          icon: buttonIcon ?? <Avatar name={initials} alt="" size={32} tooltip={false} />,
        }}
      >
        {[menuTitle, menuSubTitle].some(Boolean) && (
          <>
            <div className="px-3 py-2">
              <div className="font-bold">{menuTitle}</div>
              {menuSubTitle && <small>{menuSubTitle}</small>}
            </div>
            <DropdownMenuDivider />
          </>
        )}
        {menuGroups.map((group) => (
          <div aria-label={group.label} role="group" key={group.label}>
            {group.elements.map((item) => (
              <div role="presentation" key={item.label}>
                {item.element()}
              </div>
            ))}
          </div>
        ))}
      </DropdownMenu>
    </div>
  );
});

AppUserMenu.displayName = 'AppUserMenu';
