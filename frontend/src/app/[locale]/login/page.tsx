'use client';

import { CardElevated } from '@components/card/card-elevated.component';
import LoaderFullScreen from '@components/loader/loader-fullscreen';
import { CenterDiv } from '@layouts/center-div.component';
import EmptyLayout from '@layouts/empty-layout/empty-layout.component';
import { EntryLayout } from '@layouts/entry-layout.component';
import Main from '@layouts/main/main.component';
import { Button, Divider, FormErrorMessage } from '@sk-web-gui/react';
import { apiURL } from '@utils/api-url';
import { appURL } from '@utils/app-url';
import { capitalize } from 'lodash';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

// Turn on/off automatic login
const autoLogin = false;

const Login: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathName = usePathname();
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const { t } = useTranslation();

  const isLoggedOut = searchParams.get('loggedout') === '';
  const failMessage = searchParams.get('failMessage');

  const initalFocus = useRef<HTMLButtonElement>(null);
  const setInitalFocus = () => {
    setTimeout(() => {
      initalFocus?.current?.focus();
    });
  };

  const onLogin = () => {
    const searchPath = searchParams.get('path');
    const nonLoginPath = !pathName?.match(/\/login/) && pathName; // Contains path as long as it's not /login
    const nonLoginSearch = !searchPath?.match(/\/login|\/logout/) && searchPath; // Contains redirect path as long as it's not /login or /logout
    const path = nonLoginPath || nonLoginSearch || `${process.env.NEXT_PUBLIC_BASE_PATH}/oversikt`;

    const url = new URL(apiURL('/saml/login'));
    const queries = new URLSearchParams({
      successRedirect: `${appURL(path as string)}`,
      failureRedirect: `${appURL()}/login`,
    });
    url.search = queries.toString();
    // NOTE: send user to login with SSO
    router.push(url.toString());
  };

  useEffect(() => {
    setInitalFocus();
    if (!router) return;

    if (isLoggedOut) {
      setIsLoading(false);
    } else {
      if (failMessage === 'NOT_AUTHORIZED' && autoLogin) {
        // autologin
        onLogin();
      } else if (failMessage) {
        setErrorMessage(t(`login:errors.${failMessage}`));
        setIsLoading(false);
      } else {
        setIsLoading(false);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (isLoading) {
    // to not flash the login-screen on autologin
    return (
      <EmptyLayout>
        <LoaderFullScreen />
      </EmptyLayout>
    );
  }

  return (
    <EntryLayout>
      <div className="w-full max-w-[64rem]">
        <CardElevated>
          <Main>
            <CenterDiv className="py-24 px-8">
              {isLoggedOut ?
                <div className="flex flex-col items-center gap-[4rem] w-full">
                  <h1 className="text-center text-[4rem] font-bold leading-[5.6rem] m-0">{t('login:logged_out_title')}</h1>
                  <Button variant="primary" color="vattjom" size="lg" onClick={() => router.push('/login')}>
                    {t('login:login_again_button')}
                  </Button>
                </div>
              : <>
                  <h1 className="text-center text-h2-sm lg:text-h2-lg mb-0">{t('login:choose_login_method')}</h1>
                  <Divider className="w-full" />
                  <div className="flex flex-row desktop:flex-col gap-56 w-full desktop:w-fit px-80 pb-[10.4rem] pt-80 items-center">
                    <span>{t('login:login_problem')}</span>
                    <Button variant="primary" size="lg" onClick={() => onLogin()}>
                      {capitalize(t('common:login'))}
                    </Button>
                  </div>
                  {errorMessage && <FormErrorMessage className="text-error mt-lg">{errorMessage}</FormErrorMessage>}
                </>
              }
            </CenterDiv>
          </Main>
        </CardElevated>
      </div>
    </EntryLayout>
  );
};

export default Login;
