import { ErrandSection } from '@components/errand-sections/errand-section.component';
import { FormFieldLabel } from '@components/form-field-label/form-field-label.component';
import { useFormValidation } from '@contexts/form-validation-context';
import { ErrandDTO } from '@data-contracts/backend/data-contracts';
import { Alert } from '@sk-web-gui/alert';
import { FormControl, FormErrorMessage, RadioButton } from '@sk-web-gui/react';
import { EVENT_CONCERNS_INDIVIDUAL } from '@utils/errand-helpers';
import { INVALID_FIELD_ATTRIBUTE } from '@utils/focus-first-error';
import { EVENT_TYPE_DEVIATION, EVENT_TYPE_MISCONDUCT, EVENT_TYPE_PARAMETER_KEY } from '@utils/report-type';
import { useFormContext } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

/**
 * Etiketten i designsystemet har fast höjd och centrerar innehållet lodrätt. Utan
 * dessa klasser klipps beskrivningen och radioknappen hamnar mitt i textblocket.
 */
const RADIO_WITH_DESCRIPTION_CLASS = 'h-auto items-start';

/** Alternativets namn med förklaringen under, så att båda typerna går att jämföra innan valet. */
const RadioButtonLabelWithDescription: React.FC<{ label: string; description: string }> = ({ label, description }) => (
  <span className="flex flex-col gap-8">
    {label}
    <span className="text-dark-secondary text-small">{description}</span>
  </span>
);

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
    <div className="flex flex-col gap-40">
      <FormControl required id="event-type" {...(missingEventType ? { [INVALID_FIELD_ATTRIBUTE]: 'event-type' } : {})}>
        <FormFieldLabel>{t('errand-information:about.event_type_label')}</FormFieldLabel>
        <RadioButton.Group data-cy="event-type-group" className="gap-16">
          <RadioButton
            data-cy="event-type-deviation"
            className={RADIO_WITH_DESCRIPTION_CLASS}
            checked={eventType === EVENT_TYPE_DEVIATION}
            value={EVENT_TYPE_DEVIATION}
            onChange={() => {
              setParameter(EVENT_TYPE_PARAMETER_KEY, EVENT_TYPE_DEVIATION);
            }}
          >
            <RadioButtonLabelWithDescription
              label={t('errand-information:about.event_type_deviation')}
              description={t('errand-information:about.event_type_deviation_description')}
            />
          </RadioButton>
          <RadioButton
            data-cy="event-type-misconduct"
            className={RADIO_WITH_DESCRIPTION_CLASS}
            checked={eventType === EVENT_TYPE_MISCONDUCT}
            value={EVENT_TYPE_MISCONDUCT}
            onChange={() => {
              setParameter(EVENT_TYPE_PARAMETER_KEY, EVENT_TYPE_MISCONDUCT);
            }}
          >
            <RadioButtonLabelWithDescription
              label={t('errand-information:about.event_type_misconduct')}
              description={t('errand-information:about.event_type_misconduct_description')}
            />
          </RadioButton>
        </RadioButton.Group>
        {missingEventType && <FormErrorMessage>{t('errand-information:about.event_type_required')}</FormErrorMessage>}
        {eventType === EVENT_TYPE_MISCONDUCT && (
          <Alert type="info" data-cy="misconduct-alert">
            <Alert.Icon />
            <Alert.Content>
              <Alert.Content.Title>{t('errand-information:about.misconduct_alert_title')}</Alert.Content.Title>
              <Alert.Content.Description>
                {t('errand-information:about.misconduct_alert_description')}
              </Alert.Content.Description>
            </Alert.Content>
          </Alert>
        )}
      </FormControl>

      <FormControl
        required
        id="event-concerns"
        {...(missingEventConcerns ? { [INVALID_FIELD_ATTRIBUTE]: 'event-concerns' } : {})}
      >
        <FormFieldLabel>{t('errand-information:about.event_concerns_label')}</FormFieldLabel>
        <RadioButton.Group data-cy="event-concerns-group" className="gap-16">
          <RadioButton
            data-cy="event-concerns-individual"
            checked={eventConcerns === EVENT_CONCERNS_INDIVIDUAL}
            value={EVENT_CONCERNS_INDIVIDUAL}
            onChange={() => {
              setEventConcerns(EVENT_CONCERNS_INDIVIDUAL);
            }}
          >
            {t('errand-information:about.event_concerns_individual')}
          </RadioButton>
          <RadioButton
            data-cy="event-concerns-group-activity"
            checked={eventConcerns === 'GRUPP_VERKSAMHET'}
            value="GRUPP_VERKSAMHET"
            onChange={() => {
              setEventConcerns('GRUPP_VERKSAMHET');
            }}
          >
            {t('errand-information:about.event_concerns_group')}
          </RadioButton>
        </RadioButton.Group>
        {missingEventConcerns && (
          <FormErrorMessage>{t('errand-information:about.event_concerns_required')}</FormErrorMessage>
        )}
      </FormControl>
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
