import { Banner } from '@astryxdesign/core/Banner';
import { RadioList, RadioListItem } from '@astryxdesign/core/RadioList';
import { ErrandSection } from '@components/errand-sections/errand-section.component';
import { useFormValidation } from '@contexts/form-validation-context';
import { ErrandDTO } from '@data-contracts/backend/data-contracts';
import { EVENT_CONCERNS_INDIVIDUAL } from '@utils/errand-helpers';
import { INVALID_FIELD_ATTRIBUTE } from '@utils/focus-first-error';
import { EVENT_TYPE_DEVIATION, EVENT_TYPE_MISCONDUCT, EVENT_TYPE_PARAMETER_KEY } from '@utils/report-type';
import { useFormContext } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

export const AboutErrandContent: React.FC = () => {
  const { t } = useTranslation();
  const { getValues, setValue, watch } = useFormContext<ErrandDTO>();
  const { showValidation } = useFormValidation();

  const parameters = watch('parameters') ?? [];
  const eventType = parameters.find((p) => p.key === EVENT_TYPE_PARAMETER_KEY)?.values?.[0] ?? '';
  const eventConcerns = parameters.find((p) => p.key === 'eventConcerns')?.values?.[0] ?? '';

  const stakeholders = watch('stakeholders') ?? [];

  // Märker fälten så att felnavigeringen kan flytta fokus hit när ärendet inte går att registrera.
  const missingEventType = showValidation && !eventType;
  const missingEventConcerns = showValidation && !eventConcerns;

  const setParameter = (key: string, value: string) => {
    const currentParameters = getValues('parameters') ?? [];
    const otherParams = currentParameters.filter((p) => p.key !== key);
    setValue('parameters', [...otherParams, { key, values: [value] }]);
  };

  const setEventConcerns = (value: string) => {
    setParameter('eventConcerns', value);
    if (value !== EVENT_CONCERNS_INDIVIDUAL) {
      setValue(
        'stakeholders',
        stakeholders.filter((s) => s.role !== 'PRIMARY')
      );
    }
  };

  return (
    <div className="flex flex-col gap-8">
      <div
        id="event-type"
        data-cy="event-type-group"
        {...(missingEventType ? { [INVALID_FIELD_ATTRIBUTE]: 'event-type' } : {})}
      >
        <RadioList
          label={t('errand-information:about.event_type_label')}
          value={eventType}
          onChange={(value) => {
            setParameter(EVENT_TYPE_PARAMETER_KEY, value);
          }}
          isRequired
          status={
            missingEventType ? { type: 'error', message: t('errand-information:about.event_type_required') } : undefined
          }
        >
          <RadioListItem
            data-cy="event-type-deviation"
            value={EVENT_TYPE_DEVIATION}
            label={t('errand-information:about.event_type_deviation')}
            description={t('errand-information:about.event_type_deviation_description')}
          />
          <RadioListItem
            data-cy="event-type-misconduct"
            value={EVENT_TYPE_MISCONDUCT}
            label={t('errand-information:about.event_type_misconduct')}
            description={t('errand-information:about.event_type_misconduct_description')}
          />
        </RadioList>
        {eventType === EVENT_TYPE_MISCONDUCT && (
          <div className="mt-4">
            <Banner
              data-cy="misconduct-alert"
              status="info"
              title={t('errand-information:about.misconduct_alert_title')}
              description={t('errand-information:about.misconduct_alert_description')}
            />
          </div>
        )}
      </div>
      <div
        id="event-concerns"
        data-cy="event-concerns-group"
        {...(missingEventConcerns ? { [INVALID_FIELD_ATTRIBUTE]: 'event-concerns' } : {})}
      >
        <RadioList
          label={t('errand-information:about.event_concerns_label')}
          value={eventConcerns}
          onChange={setEventConcerns}
          isRequired
          status={
            missingEventConcerns ?
              { type: 'error', message: t('errand-information:about.event_concerns_required') }
            : undefined
          }
        >
          <RadioListItem
            data-cy="event-concerns-individual"
            value={EVENT_CONCERNS_INDIVIDUAL}
            label={t('errand-information:about.event_concerns_individual')}
          />
          <RadioListItem
            data-cy="event-concerns-group-activity"
            value="GRUPP_VERKSAMHET"
            label={t('errand-information:about.event_concerns_group')}
          />
        </RadioList>
      </div>
    </div>
  );
};

export const AboutErrand: React.FC = () => {
  const { t } = useTranslation();

  return (
    <ErrandSection header={t('errand-information:about.title')} description={t('errand-information:about.description')}>
      <AboutErrandContent />
    </ErrandSection>
  );
};
