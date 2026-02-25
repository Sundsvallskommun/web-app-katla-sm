import LucideIcon from '@sk-web-gui/lucide-icon';
import { Button } from '@sk-web-gui/react';
import { ReactNode } from 'react';

interface MobilePageProps {
  title: string;
  icon: React.ComponentProps<typeof LucideIcon>['name'];
  onClose: () => void;
  children: ReactNode;
}

export const MobilePage: React.FC<MobilePageProps> = ({ title, icon, onClose, children }) => {
  return (
    <div className="fixed inset-0 z-50 bg-background-content flex flex-col pt-[env(safe-area-inset-top)]">
      <div className="flex items-center justify-between px-16 py-12 border-b-1">
        <div className="flex items-center gap-12">
          <LucideIcon name={icon} />
          <h2 className="text-h4-sm font-bold">{title}</h2>
        </div>
        <Button iconButton variant="tertiary" aria-label="Stäng" onClick={onClose}>
          <LucideIcon name="x" />
        </Button>
      </div>
      <div className="flex-grow overflow-y-auto">{children}</div>
    </div>
  );
};
