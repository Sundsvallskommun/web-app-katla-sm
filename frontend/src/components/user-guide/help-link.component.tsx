'use client';

import { LinkButton } from '@components/navigation/link-button.component';
import { CircleHelp } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { USER_GUIDE_PATH } from './user-guide-screenshots';

interface HelpLinkProps {
  /**
   * Öppnar guiden i en ny flik. Används där sidan bär ett formulär som inte är sparat: en
   * vanlig navigering inom appen tömmer det utan varning, medan en ny flik låter användaren
   * läsa guiden och fylla i formuläret sida vid sida.
   */
  openInNewTab?: boolean;
  /** Bara ikonen, för sidhuvudets smala rad. Det tillgängliga namnet står kvar. */
  iconOnly?: boolean;
}

/** Vägen till användarguiden. Står i sidhuvudet, så att guiden går att nå från hela appen. */
export const HelpLink: React.FC<HelpLinkProps> = ({ openInNewTab = false, iconOnly = false }) => {
  const { t } = useTranslation('user-guide');
  // Namnet börjar med den synliga texten, så att röststyrning som säger "Hjälp" hittar länken.
  const label = openInNewTab ? t('help_link.label_new_tab') : t('help_link.label');

  return (
    <LinkButton
      href={USER_GUIDE_PATH}
      data-cy="help-link"
      variant="tertiary"
      size="sm"
      inverted
      showBackground={false}
      iconButton={iconOnly}
      aria-label={label}
      leftIcon={<CircleHelp aria-hidden="true" size={18} />}
      {...(openInNewTab ? { target: '_blank', rel: 'noopener' } : {})}
    >
      {iconOnly ? undefined : t('help_link.text')}
    </LinkButton>
  );
};
