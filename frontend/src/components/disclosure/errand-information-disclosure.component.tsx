import LucideIcon, { LucideIconProps } from '@sk-web-gui/lucide-icon';
import { Checkbox, Disclosure, Divider, FormControl } from '@sk-web-gui/react';
import { ReactNode, useEffect, useState } from 'react';

export const ErrandDisclosure: React.FC<{
  header: string;
  lucideIconName: React.ComponentProps<LucideIconProps>['name'];
  children: ReactNode;
  errandInformationSection?: boolean;
}> = ({ header, lucideIconName, children, errandInformationSection }) => {
  const [open, setOpen] = useState(false);
  const [doneMark, setDoneMark] = useState(false);
  //   const { errand } = useContext(AppContext);

  useEffect(() => {
    setOpen(!open);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doneMark]);

  return (
    <FormControl className="w-full" disabled={false}>
      <Disclosure
        icon={<LucideIcon name={lucideIconName} />}
        header={header}
        variant="alt"
        className="w-full mobileVersion"
        open={open}
        label={doneMark ? 'Komplett' : ''}
        labelColor={'gronsta'}
      >
        {children}
        {errandInformationSection && <Divider className="pt-20" />}

        <Checkbox onClick={() => setDoneMark(!doneMark)} checked={doneMark}>
          Markera avsnittet som komplett
        </Checkbox>
      </Disclosure>
    </FormControl>
  );
};
