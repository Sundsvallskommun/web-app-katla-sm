import { cx } from '@sk-web-gui/react';
import { CSSProperties } from 'react';

interface CalloutNumberProps {
  number: number;
  className?: string;
  style?: CSSProperties;
}

/**
 * Siffran som knyter en pil i skärmbilden till sin förklaring i listan under bilden.
 *
 * Skärmbilderna är alltid tagna i ljust läge, så siffran ska ha samma mörka rosa i båda
 * färglägena. I mörkt läge byter designsystemet värde på sina tokens, och samma nyans ligger
 * då under en annan token – därav de separata dark:-klasserna.
 *
 * Siffran döljs för skärmläsare: listan under bilden är en numrerad lista som redan läser upp
 * numret, och i bilden pekar siffran bara ut en plats.
 */
export const CalloutNumber: React.FC<CalloutNumberProps> = ({ number, className, style }) => (
  <span
    aria-hidden="true"
    style={style}
    className={cx(
      'bg-juniskar-surface-primary text-juniskar-text-secondary dark:bg-juniskar-background-300 dark:text-juniskar-text-primary',
      'inline-flex h-[2.8rem] w-[2.8rem] shrink-0 items-center justify-center rounded-full text-small font-bold leading-none',
      className
    )}
  >
    {number}
  </span>
);
