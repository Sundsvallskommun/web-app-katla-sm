import { TextInput } from '@astryxdesign/core/TextInput';
import { Search } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export const ErrandFilterQuery: React.FC = () => {
  const { t } = useTranslation();

  return (
    <TextInput
      label={t('filtering:search')}
      isLabelHidden
      value=""
      size="lg"
      data-cy="query-filter"
      width="100%"
      startIcon={<Search aria-hidden="true" size={18} />}
      placeholder={t('filtering:search')}
      onChange={() => {
        // Sökning är ännu inte ansluten till översiktens filtrering.
      }}
    />
  );
};
