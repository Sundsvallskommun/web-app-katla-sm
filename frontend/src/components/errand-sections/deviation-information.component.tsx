import { ErrandDisclosure } from '@components/disclosure/errand-information-disclosure.component';
import { useTranslation } from 'react-i18next';

export const DeviationInformation: React.FC = () => {
  const { t } = useTranslation();

  return (
    <ErrandDisclosure header={t('errand-information:deviation_information.title')} lucideIconName="user">
      <div className="flex flex-col gap-[2.4rem] pb-[2.4rem]">
      </div>
    </ErrandDisclosure>
  );
};
