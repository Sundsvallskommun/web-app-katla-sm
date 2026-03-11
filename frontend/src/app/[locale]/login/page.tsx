import { LoginContent } from '@components/auth/login-content.component';
import { CardElevated } from '@components/card/card-elevated.component';
import { CenterDiv } from '@layouts/center-div.component';
import { EntryLayout } from '@layouts/entry-layout.component';
import Main from '@layouts/main/main.component';

export default function Login() {
  return (
    <EntryLayout>
      <div className="w-full max-w-[64rem]">
        <CardElevated>
          <Main>
            <CenterDiv className="py-24 px-8">
              <LoginContent />
            </CenterDiv>
          </Main>
        </CardElevated>
      </div>
    </EntryLayout>
  );
}
