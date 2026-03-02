import { ErrandDisclosure } from '@components/disclosure/errand-information-disclosure.component';
import { ErrandDTO } from '@data-contracts/backend/data-contracts';
import { FormControl, FormErrorMessage, FormLabel, Select } from '@sk-web-gui/react';
import { useFormContext } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useMetadataStore } from 'src/stores/metadata-store';

export const AboutErrand: React.FC = () => {
  const { metadata } = useMetadataStore();
  const { t } = useTranslation();
  const context = useFormContext<ErrandDTO>();
  const {
    register,
    watch,
    formState: { errors },
  } = context;

  const selectedCategory = watch('classification.category');
  const labelsList = metadata?.labels?.labelStructure || [];
  const typesList = labelsList.find((l) => l.resourceName === selectedCategory)?.labels || [];

  return (
    <ErrandDisclosure header={t('errand-information:about.title')} lucideIconName="info">
      <div className="flex flex-col gap-[2.4rem] pb-[2.4rem]">
        <span className="text-dark-secondary">{t('errand-information:about.description')}</span>
        <div className="flex flex-col md:flex-row gap-[2.4rem]">
          <div className="flex flex-col w-full md:w-[44.4rem]">
            <FormControl required id="classification.category" className="w-full">
              <FormLabel>{t('errand-information:about.first_level_categorization')}</FormLabel>
              <Select data-cy="category-input" className="w-full" {...register('classification.category')}>
                <Select.Option>{t('errand-information:about.choose_one_option')}</Select.Option>
                {labelsList
                  .sort((a, b) => (a.displayName ?? '').localeCompare(b.displayName ?? ''))
                  .map((label) => (
                    <Select.Option value={label.resourceName} key={`category-${label.resourceName}`}>
                      {label.displayName}
                    </Select.Option>
                  ))}
              </Select>
              {errors.classification?.category && <FormErrorMessage className="text-error">{errors.classification?.category?.message}</FormErrorMessage>}
            </FormControl>
          </div>
          <div className="flex flex-col w-full md:w-[44.4rem]">
            <FormControl required id="classification.type" className="w-full">
              <FormLabel>{t('errand-information:about.second_level_categorization')}</FormLabel>
              <Select data-cy="type-input" className="w-full" {...register('classification.type')}>
                <Select.Option>{t('errand-information:about.choose_one_option')}</Select.Option>
                {typesList.map((label) => (
                  <Select.Option value={label.resourceName} key={`type-${label.resourceName}`}>
                    {label.displayName}
                  </Select.Option>
                ))}
              </Select>
              {errors.classification?.type && <FormErrorMessage>{errors.classification?.type?.message}</FormErrorMessage>}
            </FormControl>
          </div>
        </div>
      </div>
    </ErrandDisclosure>
  );
};
