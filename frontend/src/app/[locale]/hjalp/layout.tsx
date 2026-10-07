import EmptyLayout from '@layouts/empty-layout/empty-layout.component';
import { HelpLayout } from '@layouts/help-layout/help-layout.component';

export default function HjalpLayout({ children }: { children: React.ReactNode }) {
  return (
    <EmptyLayout>
      <HelpLayout>{children}</HelpLayout>
    </EmptyLayout>
  );
}
