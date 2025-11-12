import { cx } from '@sk-web-gui/react';

export const CenterDiv: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => {
  return <div className={cx('flex w-full flex-col items-center justify-center', className)}>{children}</div>;
};
