'use client';
import { SubmitButtonProps } from '@rjsf/utils';
import LucideIcon from '@sk-web-gui/lucide-icon';
import { Button } from '@sk-web-gui/react';
import { useTranslation } from 'react-i18next';

interface SubmitButtonOptions {
  label?: string;
  variant?: 'primary' | 'secondary' | 'tertiary' | 'ghost';
  color?: string;
  className?: string;
  leadingIcon?: boolean | string;
}

export function SubmitButtonFieldTemplate(props: SubmitButtonProps<Record<string, unknown>, Record<string, unknown>, Record<string, unknown>>) {
  const { t } = useTranslation('forms');
  const uiSchema = (props as Record<string, unknown>).uiSchema as Record<string, unknown> | undefined || {};
  const buttonOptions: SubmitButtonOptions = (uiSchema['ui:options'] as SubmitButtonOptions) || {};

  const label = buttonOptions.label || t('submit_button_default');
  const variant = buttonOptions.variant || 'primary';
  const className = buttonOptions.className || 'mt-[3.2rem]';
  const leadingIcon = buttonOptions.leadingIcon !== false;

  return (
    <div className={className}>
      <Button type="submit" variant={variant} leftIcon={leadingIcon ? <LucideIcon name="plus" /> : undefined}>
        {label}
      </Button>
    </div>
  );
}
