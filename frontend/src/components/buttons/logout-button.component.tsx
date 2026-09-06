'use client';

import { Button } from '@astryxdesign/core/Button';
import { DropdownMenuItem } from '@astryxdesign/core/DropdownMenu';
import { capitalize } from 'lodash';
import { LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';
import type { ButtonHTMLAttributes } from 'react';
import { forwardRef } from 'react';
import { useTranslation } from 'react-i18next';

interface LogoutButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children' | 'color'> {
  smallSideBar?: boolean;
  testId?: string;
  inMenu?: boolean;
}

export const LogoutButton = forwardRef<HTMLButtonElement, LogoutButtonProps>((props, ref) => {
  const {
    className,
    onClick,
    smallSideBar = false,
    testId = 'logout-button',
    inMenu = false,
    disabled,
    ...rest
  } = props;
  const { t } = useTranslation();
  const router = useRouter();

  const handleLogout = () => {
    router.push('/logout');
  };

  const logOutString = capitalize(t('common:logout'));

  if (inMenu) {
    return (
      <DropdownMenuItem
        label={<span data-cy={testId}>{logOutString}</span>}
        icon={<LogOut aria-hidden="true" size={18} />}
        onClick={handleLogout}
        isDisabled={disabled}
      />
    );
  }

  return (
    <Button
      {...rest}
      ref={ref}
      data-cy={testId}
      onClick={(event) => {
        onClick?.(event);
        handleLogout();
      }}
      label={logOutString}
      variant="ghost"
      size="lg"
      width="100%"
      isDisabled={disabled}
      className={className}
      icon={<LogOut aria-hidden="true" size={18} />}
      isIconOnly={smallSideBar}
    >
      {!smallSideBar && <span className="w-full flex justify-between">{logOutString}</span>}
    </Button>
  );
});

LogoutButton.displayName = 'LogoutButton';
