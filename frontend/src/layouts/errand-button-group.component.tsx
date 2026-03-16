import {
  errandFormDataToJsonParameters,
  jsonParametersToErrandFormData,
  validateErrandFormData,
} from '@components/json/utils/schema-utils';
import { useFormValidation } from '@contexts/form-validation-context';
import { createErrand, updateErrand } from '@services/errand-service/errand-service';
import { StakeholderDTO } from '@data-contracts/backend/data-contracts';
import { Inbox } from 'lucide-react';
import { Button, Dialog, useSnackbar } from '@sk-web-gui/react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useFormContext } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { CenterDiv } from './center-div.component';
import { appConfig } from 'src/config/appconfig';
import { LabelDTO } from '@data-contracts/backend/data-contracts';
import { useMetadataStore } from 'src/stores/metadata-store';
import { ErrandFormDTO, ErrandFormDataItem } from '@interfaces/errand-form';

interface ErrandButtonGroupProps {
  isNewErrand: boolean;
}

export const ErrandButtonGroup: React.FC<ErrandButtonGroupProps> = ({ isNewErrand }) => {
  const { t } = useTranslation();
  const { t: tForms } = useTranslation('forms');
  const toastMessage = useSnackbar();
  const router = useRouter();
  const context = useFormContext<ErrandFormDTO>();
  const { getValues, reset, watch } = context;
  const { setShowValidation } = useFormValidation();
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const { metadata } = useMetadataStore();

  const errandStatus = watch('status');
  const errandId = watch('id');

  const isDraft = errandStatus === 'DRAFT';
  const showButtons = isNewErrand || isDraft;
  const draftEnabled = appConfig.features.draftEnabled;

  const findLabel = (resourceName: string): LabelDTO | undefined => {
    const findInStructure = (labels: LabelDTO[]): LabelDTO | undefined => {
      for (const label of labels) {
        if (label.resourceName === resourceName) return label;
        if (label.labels?.length) {
          const found = findInStructure(label.labels);
          if (found) return found;
        }
      }
      return undefined;
    };
    return metadata?.labels?.labelStructure ? findInStructure(metadata.labels.labelStructure) : undefined;
  };

  const flattenLabel = (label: LabelDTO): LabelDTO[] => {
    const { labels: children, ...labelWithoutChildren } = label;
    const result: LabelDTO[] = [labelWithoutChildren];
    if (children?.length) {
      children.forEach((child) => result.push(...flattenLabel(child)));
    }
    return result;
  };

  const buildLabels = (eventType: string): LabelDTO[] => {
    const labels: LabelDTO[] = [];

    const uncategorizedLabel = findLabel('UNCATEGORIZED');
    if (uncategorizedLabel) {
      labels.push(...flattenLabel(uncategorizedLabel));
    }

    if (eventType === 'MISSFORHALLANDE') {
      const adverseLabel = findLabel('ADVERSE_INCIDENT');
      if (adverseLabel) {
        labels.push(...flattenLabel(adverseLabel));
      }
    }

    return labels;
  };
  
  const getFacilityOrgName = (errandFormData: ErrandFormDataItem[] | undefined): string | undefined => {
    const platsEntry = errandFormData?.find((e) => e.schemaName === 'avvikelse-plats-handelse');
    if (!platsEntry?.data) return undefined;
    const parsed = JSON.parse(platsEntry.data);
    for (const value of Object.values(parsed)) {
      if (value && typeof value === 'object' && 'orgName' in (value as Record<string, unknown>)) {
        return (value as Record<string, string>).orgName;
      }
    }
    return undefined;
  };

  const prepareErrandForApi = (values: ErrandFormDTO, status: string) => {
    const { errandFormData, ...errandWithoutFormData } = values;
    const eventType = values.parameters?.find((p) => p.key === 'eventType')?.values?.[0] ?? '';
    const eventConcerns = values.parameters?.find((p) => p.key === 'eventConcerns')?.values?.[0];

    let stakeholders = errandWithoutFormData.stakeholders ?? [];

    if (eventConcerns === 'GRUPP_VERKSAMHET') {
      const orgName = getFacilityOrgName(errandFormData);
      if (orgName) {
        const facilityStakeholder: StakeholderDTO = {
          firstName: orgName,
          role: 'PRIMARY',
        };
        stakeholders = [...stakeholders.filter((s) => s.role !== 'PRIMARY'), facilityStakeholder];
      }
    }

    return {
      ...errandWithoutFormData,
      stakeholders,
      status,
      labels: buildLabels(eventType),
      jsonParameters: errandFormDataToJsonParameters(errandFormData),
    };
  };

  const onSaveDraft = async () => {
    const errandData = prepareErrandForApi(getValues(), 'DRAFT');

    try {
      const errand = await (errandId ? updateErrand(errandId, errandData) : createErrand(errandData));
      const errandFormData = jsonParametersToErrandFormData(errand.jsonParameters);
      toastMessage({ position: 'bottom', status: 'success', message: t('errand-information:save_message.draft') });
      reset({ ...errand, errandFormData });

      if (isNewErrand) {
        router.push(`${process.env.NEXT_PUBLIC_BASE_PATH}/arende/${errand.errandNumber}/grundinformation`);
      }
    } catch {
      toastMessage({ position: 'bottom', status: 'error', message: t('errand-information:save_message.error') });
    }
  };

  const onRegister = async (logout?: boolean) => {
    setIsOpen(false);

    const errandData = prepareErrandForApi(getValues(), 'NEW');

    try {
      const errand = await (errandId ? updateErrand(errandId, errandData) : createErrand(errandData));
      const errandFormData = jsonParametersToErrandFormData(errand.jsonParameters);
      toastMessage({ position: 'bottom', status: 'success', message: t('errand-information:save_message.register') });
      reset({ ...errand, errandFormData });

      if (logout) {
        router.push(`/logout`);
      } else {
        router.push(`/arende/${errand.errandNumber}/grundinformation`);
      }
    } catch {
      toastMessage({ position: 'bottom', status: 'error', message: t('errand-information:save_message.error') });
    }
  };

  if (!showButtons) {
    return null;
  }

  return (
    <div className="flex flex-row gap-[1.8rem]">
      {isNewErrand && (
        <Button variant="secondary" onClick={() => router.push(`/oversikt`)}>
          {t('errand-information:cancel')}
        </Button>
      )}
      {draftEnabled && (
        <Button data-cy="save-draft-errand" variant="primary" onClick={() => onSaveDraft()}>
          {t('errand-information:save_draft')}
        </Button>
      )}
      <Button
        data-cy="register-errand"
        variant="primary"
        color="vattjom"
        onClick={async () => {
          // Aktivera validering för JSON-formulär
          setShowValidation(true);

          // Validera att eventType och eventConcerns är valda
          const values = getValues();
          const eventType = values.parameters?.find((p) => p.key === 'eventType')?.values?.[0];
          const eventConcerns = values.parameters?.find((p) => p.key === 'eventConcerns')?.values?.[0];
          if (!eventType) {
            toastMessage({
              position: 'bottom',
              status: 'error',
              message: t('errand-information:about.event_type_required'),
            });
            return;
          }
          if (!eventConcerns) {
            toastMessage({
              position: 'bottom',
              status: 'error',
              message: t('errand-information:about.event_concerns_required'),
            });
            return;
          }
          if (eventConcerns === 'GRUPP_VERKSAMHET' && !getFacilityOrgName(values.errandFormData)) {
            toastMessage({
              position: 'bottom',
              status: 'error',
              message: t('errand-information:about.event_concerns_group_facility_required'),
            });
            return;
          }

          // Validera errandFormData
          const formDataErrors = await validateErrandFormData(values.errandFormData, tForms);

          if (formDataErrors.length > 0) {
            toastMessage({
              position: 'bottom',
              status: 'error',
              message: formDataErrors[0],
            });
            return;
          }

          setIsOpen(true);
        }}
      >
        {t('errand-information:register')}
      </Button>
      <Dialog show={isOpen}>
        <Dialog.Content className="-mt-20">
          <CenterDiv>
            <Inbox size={32} className="mb-[1.6rem] text-vattjom-surface-primary" />
            <h3 className="text-h3-md">{t('errand-information:register')}</h3>
            <span className="text-dark-secondary text-md mb-30">
              När du skickar in ett ärende. Lorem ipsum dolor sit amet consectuer
            </span>
            <span className="text-dark-secondary text-md">Vill du skicka in ärendet?</span>
          </CenterDiv>
        </Dialog.Content>

        <Dialog.Buttons className="justify-center">
          <Button variant="secondary" onClick={() => setIsOpen(false)}>
            Nej
          </Button>
          <Button data-cy="submit-button" variant="primary" onClick={() => onRegister()}>
            Skicka in
          </Button>
          <Button data-cy="submit-logout-button" variant="primary" color="vattjom" onClick={() => onRegister(true)}>
            Skicka in och logga ut
          </Button>
        </Dialog.Buttons>
      </Dialog>
    </div>
  );
};
