'use client';

import { Button } from '@astryxdesign/core/Button';
import { Heading } from '@astryxdesign/core/Heading';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import LoaderFullScreen from '@components/loader/loader-fullscreen';
import { ErrorAlert } from '@components/misc/error-alert.component';
import { apiURL } from '@utils/api-url';
import { appURL } from '@utils/app-url';
import { capitalize } from 'lodash';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { appConfig } from 'src/config/appconfig';

import { loginRedirectPath } from './login-redirect';

// Turn on/off automatic login
const autoLogin = false;

export const LoginContent: React.FC = () => {
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
    const path = loginRedirectPath({
      mode: appConfig.mode,
      basePath: process.env.NEXT_PUBLIC_BASE_PATH ?? '',
      pathname: pathName,
      requestedPath: searchParams.get('path'),
    });

    const url = new URL(apiURL('/saml/login'));
    const queries = new URLSearchParams({
      successRedirect: appURL(path),
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
        setErrorMessage(t(`login:errors.${failMessage}`, { defaultValue: t('login:errors.UNKNOWN_ERROR') }));
        setIsLoading(false);
      } else {
        setIsLoading(false);
      }
    }
  }, []);

  if (isLoading) {
    // to not flash the login-screen on autologin
    return <LoaderFullScreen />;
  }

  return (
    <VStack gap={5} align="center" padding={6}>
      <Heading level={1} justify="center" className="max-w-full break-words">
        {t(isLoggedOut ? 'login:logged_out_title' : 'login:choose_login_method')}
      </Heading>
      {!isLoggedOut && (
        <Text color="secondary" justify="center">
          {t('login:login_problem')}
        </Text>
      )}
      <Button
        ref={initalFocus}
        data-cy={isLoggedOut ? undefined : 'login-button'}
        label={isLoggedOut ? t('login:login_again_button') : capitalize(t('common:login'))}
        variant="primary"
        size="lg"
        onClick={() => {
          if (isLoggedOut) router.push('/login');
          else onLogin();
        }}
      />
      {errorMessage && <ErrorAlert message={errorMessage} />}
    </VStack>
  );
};
