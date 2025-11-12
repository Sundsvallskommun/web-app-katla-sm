import { cx } from '@sk-web-gui/react';

export const CardElevated: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => {
  return (
    <div
      className={cx(
        'border-groups border-[0.1rem] border-divider bg-background-content rounded-groups shadow-200',
        className
      )}
    >
      {children}
    </div>
  );
};
