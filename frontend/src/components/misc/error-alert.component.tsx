'use client';

import { Banner } from '@astryxdesign/core/Banner';

interface ErrorAlertProps {
  className?: string;
  message: string;
}

/**
 * Gemensam presentation av ett API-fel. Äger rollen, uppmärkningen och
 * ikonen genom Banner så att felmeddelanden annonseras en gång och ser likadana ut
 * oavsett vilken yta som visar dem.
 */
export const ErrorAlert: React.FC<ErrorAlertProps> = ({ className, message }) => (
  <Banner status="error" title={message} className={className} />
);

interface ErrorAlertListProps {
  messages: string[];
}

/** Renderar flera samtidiga fel, till exempel metadata- och ärendefel på samma yta. */
export const ErrorAlertList: React.FC<ErrorAlertListProps> = ({ messages }) => (
  <>
    {messages.map((message, index) => (
      <ErrorAlert key={`${index}-${message}`} message={message} />
    ))}
  </>
);
