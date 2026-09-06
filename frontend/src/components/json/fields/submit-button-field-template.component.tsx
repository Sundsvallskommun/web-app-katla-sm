'use client';
import { Button } from '@astryxdesign/core/Button';
import { SubmitButtonProps } from '@rjsf/utils';
import { Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface SubmitButtonOptions {
  label?: string;
  variant?: 'primary' | 'secondary' | 'tertiary' | 'ghost';
  color?: string;
  className?: string;
  leadingIcon?: boolean | string;
}

export function SubmitButtonFieldTemplate(props: SubmitButtonProps<Record<string, unknown>>) {
  const { t } = useTranslation('forms');
  const uiSchema = props.uiSchema ?? {};
  const buttonOptions = (uiSchema['ui:options'] ?? {}) as SubmitButtonOptions;

  const label = (buttonOptions.label ?? '') || t('submit_button_default');
  const variant = buttonOptions.variant ?? 'primary';
  const className = (buttonOptions.className ?? '') || 'mt-8';
  const leadingIcon = buttonOptions.leadingIcon !== false;

  return (
    <div className={className}>
      <Button
        type="submit"
        label={label}
        variant={variant === 'tertiary' ? 'ghost' : variant}
        icon={leadingIcon ? <Plus aria-hidden="true" /> : undefined}
      />
    </div>
  );
}
