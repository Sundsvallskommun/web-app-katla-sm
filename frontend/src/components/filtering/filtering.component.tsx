import { CheckboxInput } from '@astryxdesign/core/CheckboxInput';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

const Filtering: React.FC = () => {
  const { t } = useTranslation();
  const [checked, setChecked] = useState(false);

  return (
    <div className="flex items-center gap-4 py-4">
      <CheckboxInput label={t('filtering:my_errands')} value={checked} onChange={setChecked} />
    </div>
  );
};

export default Filtering;
