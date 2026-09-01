import { StakeholderCard } from '@components/card/stakeholder-card.component';
import { EmploymentTypeChoice } from '@components/errand-sections/employment-type-choice.component';
import { ErrandSection } from '@components/errand-sections/errand-section.component';
import { COLLEAGUE_FIELD_ID } from '@components/errand-sections/section-field-ids';
import { SectionHeader } from '@components/misc/section-header.component';
import { StakeholderList } from '@components/misc/stakeholder.component';
import { ErrandFormDTO } from '@interfaces/errand-form';
import { Checkbox, Spinner } from '@sk-web-gui/react';
import { getReporterStakeholder } from '@utils/stakeholder';
import { useEffect } from 'react';
import { useFieldArray, useFormContext } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

export const ReporterContent: React.FC = () => {
  const { t } = useTranslation();
  const { watch, control, setValue } = useFormContext<ErrandFormDTO>();
  const { stakeholders } = watch();
  // Valet ligger i formuläret, inte i komponenten: valideringen måste kunna se att en kollega
  // utlovats men inte fyllts i, och den läser bara formulärets värden.
  const otherReporter = watch('reportingForColleague') ?? false;

  const reporterIndex = stakeholders?.findIndex((s) => s.role === 'REPORTER') ?? -1;

  const { remove } = useFieldArray({
    control,
    name: 'stakeholders',
  });

  // Auto-check the checkbox if CONTACT stakeholders already exist (e.g. loading existing errand)
  useEffect(() => {
    const hasContact = stakeholders?.some((s) => s.role === 'CONTACT');
    if (hasContact && !otherReporter) {
      setValue('reportingForColleague', true);
    }
  }, [stakeholders]);

  const handleOtherReporterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked;
    setValue('reportingForColleague', checked);

    if (!checked) {
      // Remove CONTACT stakeholders in reverse order to preserve indices
      const indicesToRemove = (stakeholders ?? [])
        .map((s, i) => (s.role === 'CONTACT' ? i : -1))
        .filter((i) => i !== -1)
        .reverse();
      indicesToRemove.forEach((i) => {
        remove(i);
      });
    }
  };

  return (
    <div className="flex flex-col gap-32">
      {getReporterStakeholder(stakeholders) ?
        <>
          <StakeholderCard
            stakeholder={getReporterStakeholder(stakeholders) ?? {}}
            isEditable
            hideRemove
            // Avsnittet heter Rapportör och rymmer bara rapportören, så rollraden på kortet
            // upprepar rubriken. Kortet får i stället ligga i avsnittets fulla bredd.
            hideRole
            wide
            editableFields={['emails', 'phoneNumbers']}
            index={reporterIndex}
            roles={['REPORTER']}
          >
            <EmploymentTypeChoice index={reporterIndex} name="reporter" />
          </StakeholderCard>
          <Checkbox checked={otherReporter} onChange={handleOtherReporterChange}>
            {t('errand-information:stakeholder.reporting_for_colleague')}
          </Checkbox>
          {otherReporter && (
            <div className="flex flex-col gap-32">
              <SectionHeader
                as="h3"
                title={t('errand-information:other_reporter.title')}
                description={t('errand-information:other_reporter.description')}
              />
              <StakeholderList
                roles={['CONTACT', 'SUBSTITUTEASSIGNMENT']}
                autoDetectSearch
                maxCount={1}
                fieldId={COLLEAGUE_FIELD_ID}
                hideRoleSelect
                sectionCards
                // Anställningsformen hör till kollegan och står därför i hens eget kort.
                renderCardExtra={(index) => <EmploymentTypeChoice index={index} name="colleague" />}
              />
            </div>
          )}
        </>
      : <Spinner />}
    </div>
  );
};

export const Reporter: React.FC = () => {
  const { t } = useTranslation();

  return (
    <ErrandSection
      header={t('errand-information:reporter.title')}
      description={t('errand-information:reporter.description')}
    >
      <ReporterContent />
    </ErrandSection>
  );
};
