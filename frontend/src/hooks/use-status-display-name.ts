'use client';

import { getStatusDisplayName, METADATA_LANGUAGE } from '@utils/errand-status';
import { useTranslation } from 'react-i18next';
import { useMetadataStore } from 'src/stores/metadata-store';

/**
 * Statusens namn i det språk som visas. Metadatan levereras bara på svenska, så på andra språk går
 * vår egen översättning först och metadatan täcker upp för de statusar vi inte översatt.
 */
export function useStatusDisplayName(): (status: string | undefined) => string {
  const { t, i18n } = useTranslation();
  const { metadata } = useMetadataStore();
  const preferTranslation = !i18n.language.startsWith(METADATA_LANGUAGE);

  return (status) =>
    getStatusDisplayName(status, metadata?.statuses, {
      translation: status ? t(`common:status.${status}`, { defaultValue: '' }) : undefined,
      preferTranslation,
    });
}
