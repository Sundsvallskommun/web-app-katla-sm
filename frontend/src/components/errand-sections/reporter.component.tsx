import { CheckboxInput } from '@astryxdesign/core/CheckboxInput';
import { List } from '@astryxdesign/core/List';
import { Spinner } from '@astryxdesign/core/Spinner';
import { ErrandSection } from '@components/errand-sections/errand-section.component';
import { COLLEAGUE_FIELD_ID } from '@components/errand-sections/section-field-ids';
import { SectionHeader } from '@components/misc/section-header.component';
import { StakeholderList } from '@components/misc/stakeholder.component';
import { StakeholderRow } from '@components/misc/stakeholder-row.component';
import { ErrandFormDTO } from '@interfaces/errand-form';
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

  const handleOtherReporterChange = (checked: boolean) => {
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
    <div className="flex flex-col gap-8">
      {getReporterStakeholder(stakeholders) ?
        <>
          <List>
            <StakeholderRow stakeholder={getReporterStakeholder(stakeholders) ?? {}} hideRole roles={['REPORTER']} />
          </List>
          <CheckboxInput
            value={otherReporter}
            onChange={handleOtherReporterChange}
            label={t('errand-information:stakeholder.reporting_for_colleague')}
          />
          {otherReporter && (
            <div className="flex flex-col gap-8">
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
                hideRole
              />
            </div>
          )}
        </>
      : <Spinner label={t('common:loading_information')} />}
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
