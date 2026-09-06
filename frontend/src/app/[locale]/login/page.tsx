import { Card } from '@astryxdesign/core/Card';
import { LoginContent } from '@components/auth/login-content.component';
import { EntryLayout } from '@layouts/entry-layout.component';
import Main from '@layouts/main/main.component';

export default function Login() {
  return (
    <EntryLayout>
      <div className="w-full max-w-[40rem]">
        <Card padding={0}>
          <Main>
            <LoginContent />
          </Main>
        </Card>
      </div>
    </EntryLayout>
  );
}
