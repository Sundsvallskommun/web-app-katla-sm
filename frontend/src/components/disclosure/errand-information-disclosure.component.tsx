import LucideIcon, { LucideIconProps } from '@sk-web-gui/lucide-icon';
import { Checkbox, Disclosure, Divider, FormControl, Label } from '@sk-web-gui/react';
import { ReactNode, useEffect, useState } from 'react';

export const ErrandDisclosure: React.FC<{
  header: string;
  lucideIconName: React.ComponentProps<LucideIconProps>['name'];
  children: ReactNode;
  errandInformationSection?: boolean;
}> = ({ header, lucideIconName, children, errandInformationSection }) => {
  const [open, setOpen] = useState(true);
  const [doneMark, setDoneMark] = useState(false);

  useEffect(() => {
    if (doneMark) {
      setOpen(!open);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doneMark]);

  return (
    <FormControl className="w-full" disabled={false}>
      <Disclosure variant="alt" className="w-full mobileVersion" open={open} onToggleOpen={setOpen}>
        <Disclosure.Header>
          <Disclosure.Icon icon={<LucideIcon name={lucideIconName} />} />
          <Disclosure.Title>{header}</Disclosure.Title>
          {doneMark && (
            <Label inverted rounded color="gronsta">
              Komplett
            </Label>
          )}
          <Disclosure.Button />
        </Disclosure.Header>
        <Disclosure.Content>
          {children}
          {errandInformationSection && <Divider className="pt-20" />}

          <Checkbox onClick={() => setDoneMark(!doneMark)} checked={doneMark}>
            Markera avsnittet som komplett
          </Checkbox>
        </Disclosure.Content>
      </Disclosure>
    </FormControl>
  );
};
