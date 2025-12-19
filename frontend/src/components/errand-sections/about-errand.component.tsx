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
  const typesList = metadata?.categories?.find((c) => c.name === selectedCategory)?.types || [];

  return (
    <ErrandDisclosure header={t('errand-information:about.title')} lucideIconName="info">
      <div className="flex flex-col gap-[2.4rem] pb-[2.4rem]">
        <span className="text-dark-secondary">{t('errand-information:about.description')}</span>
        <div className="flex flex-row gap-[2.4rem]">
          <div className="flex flex-col">
            <FormControl required id="classification.category">
              <FormLabel>{t('errand-information:about.first_level_categorization')}</FormLabel>
              <Select data-cy="category-input" className="w-[44.4rem]" {...register('classification.category')}>
                <Select.Option>{t('errand-information:about.choose_one_option')}</Select.Option>
                {metadata?.categories
                  ?.sort((a, b) => (a.displayName ?? '').localeCompare(b.displayName ?? ''))
                  .map((category) => (
                    <Select.Option value={category.name} key={`category-${category.name}`}>
                      {category.displayName}
                    </Select.Option>
                  ))}
              </Select>
              {errors.classification?.category && <FormErrorMessage className="text-error">{errors.classification?.category?.message}</FormErrorMessage>}
            </FormControl>
          </div>
          <div className="flex flex-col">
            <FormControl required id="classification.type">
              <FormLabel>{t('errand-information:about.second_level_categorization')}</FormLabel>
              <Select data-cy="type-input" className="w-[44.4rem]" {...register('classification.type')}>
                <Select.Option>{t('errand-information:about.choose_one_option')}</Select.Option>
                {typesList.map((type) => (
                  <Select.Option value={type.name} key={`type-${type.name}`}>
                    {type.displayName}
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
