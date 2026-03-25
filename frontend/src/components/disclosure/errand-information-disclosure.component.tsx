import { ErrandDTO } from '@data-contracts/backend/data-contracts';
import { Checkbox, Disclosure, Divider, FormControl, Label } from '@sk-web-gui/react';
import { ReactElement, ReactNode, useEffect, useState } from 'react';
import { useFormContext } from 'react-hook-form';
import { appConfig } from 'src/config/appconfig';

export const ErrandDisclosure: React.FC<{
  header: string;
  icon: ReactElement;
  children: ReactNode;
  errandInformationSection?: boolean;
  disabled?: boolean;
  initialOpen?: boolean;
}> = ({ header, icon, children, errandInformationSection, disabled = false, initialOpen = true }) => {
  const [open, setOpen] = useState(initialOpen);
  const [doneMark, setDoneMark] = useState(false);

    const { watch } = useFormContext<ErrandDTO>();
  
    const errandStatus = watch('status');
    const isDraft = errandStatus === 'DRAFT';

  useEffect(() => {
    setOpen(initialOpen);
  }, [initialOpen]);

  useEffect(() => {
    if (doneMark) {
      setOpen(!open);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doneMark]);

  return (
    <Disclosure variant="alt" className="w-full mobileVersion" open={open} onToggleOpen={setOpen}>
      <Disclosure.Header>
        <Disclosure.Icon icon={icon} />
        <Disclosure.Title>{header}</Disclosure.Title>
        {doneMark && (
          <Label inverted rounded color="gronsta">
            Komplett
          </Label>
        )}
        <Disclosure.Button />
      </Disclosure.Header>
      <Disclosure.Content>
        <FormControl className={`w-full ${!isDraft && 'pointer-events-none opacity-80'}`} disabled={disabled}>
          {children}
        </FormControl>
        {errandInformationSection && <Divider className="pt-20" />}

        {appConfig.features.disclosureDoneMark && (
          <Checkbox onClick={() => setDoneMark(!doneMark)} checked={doneMark} disabled={disabled}>
            Markera avsnittet som komplett
          </Checkbox>
        )}
      </Disclosure.Content>
    </Disclosure>
  );
};
