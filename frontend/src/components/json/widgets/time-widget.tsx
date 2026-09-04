'use client';
import type { WidgetProps } from '@rjsf/utils';
import { Input } from '@sk-web-gui/react';
import dayjs from 'dayjs';

import { getCommonProps, requiredProps } from './types';

const DEFAULT_CLASS = 'w-full';

/**
 * Ett nativt tidsfält lämnar HH:mm, men JSON Schemas `time`-format är RFC 3339:s full-time och
 * kräver både sekunder och tidszonsoffset — `14:30` och `14:30:00` avvisas båda av API:ts
 * validator. Offseten är webbläsarens egen, så den valda klockslaget behåller sin innebörd;
 * `Z` hade flyttat tiden till UTC.
 *
 * Kompletteringen görs bara när schemat kräver formatet, så att fält utan format behåller exakt
 * det värde användaren valde.
 */
function toSchemaValue(value: string, requiresRfc3339Time: boolean): string | undefined {
  if (value === '') return undefined;
  if (!requiresRfc3339Time) return value;

  const withSeconds = value.split(':').length === 2 ? `${value}:00` : value;
  return `${withSeconds}${dayjs().format('Z')}`;
}

/**
 * Det nativa fältet visar bara HH:mm eller HH:mm:ss. Ett sparat värde bär även offseten, och
 * utan den här beskärningen står fältet tomt när ett utkast öppnas igen.
 */
function toInputValue(value: unknown): string {
  if (typeof value !== 'string') return '';

  const [, time] = /^(\d{2}:\d{2})/.exec(value) ?? [];
  return time ?? '';
}

export function TimeWidget(props: WidgetProps) {
  const { id, value, disabled, readonly, required, invalid, describedBy, className, onChange, onBlur, onFocus } =
    getCommonProps(props, DEFAULT_CLASS);
  const requiresRfc3339Time = props.schema.format === 'time';

  return (
    <Input
      id={id}
      className={className}
      type="time"
      value={toInputValue(value)}
      disabled={disabled}
      readOnly={readonly}
      {...requiredProps(required)}
      aria-describedby={describedBy}
      aria-invalid={invalid}
      onBlur={onBlur}
      onFocus={onFocus}
      onChange={(e) => {
        onChange(toSchemaValue(e.currentTarget.value, requiresRfc3339Time));
      }}
    />
  );
}
