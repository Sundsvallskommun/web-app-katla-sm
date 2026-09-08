'use client';

import { Button } from '@astryxdesign/core/Button';
import { CheckboxInput } from '@astryxdesign/core/CheckboxInput';
import { Dialog, DialogHeader } from '@astryxdesign/core/Dialog';
import { useFocusTrap } from '@astryxdesign/core/hooks';
import { VStack } from '@astryxdesign/core/VStack';
import NextLink from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { appConfig } from 'src/config/appconfig';

// Existing consent is persisted under this name; changing UI must not reset it.
const CONSENT_COOKIE = 'SKCookieConsent';

export const CookieConsentSection: React.FC = () => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [functional, setFunctional] = useState(false);
  const [statistics, setStatistics] = useState(false);
  const saveRef = useRef<HTMLButtonElement>(null);
  const manageRef = useRef<HTMLButtonElement>(null);
  const { containerRef } = useFocusTrap<HTMLDialogElement>({ isActive: isOpen });

  useEffect(() => {
    const stored = document.cookie.split(';').some((entry) => {
      const [name, ...value] = entry.trim().split('=');
      return name === CONSENT_COOKIE && value.join('=').length > 0;
    });
    setIsOpen(!stored);
  }, []);

  useEffect(() => {
    if (isEditing) saveRef.current?.focus();
  }, [isEditing]);

  const save = (accepted: string[]) => {
    document.cookie = `${CONSENT_COOKIE}=${encodeURIComponent(accepted.join(','))}; Path=/; Max-Age=31536000; SameSite=Strict`;
    setIsOpen(false);
  };

  return (
    <Dialog
      ref={containerRef}
      isOpen={isOpen}
      onOpenChange={() => {
        /* A consent choice closes this dialog. */
      }}
      width={560}
    >
      <DialogHeader title={t('layout:cookies.title', { app: appConfig.applicationName })} />
      <VStack gap={4} padding={5} isScrollable className="min-h-0">
        {isEditing ?
          <fieldset className="flex flex-col gap-4">
            <legend className="mb-4 font-semibold">{t('layout:cookies.choose')}</legend>
            <CheckboxInput
              label={t('layout:cookies.necessary.displayName')}
              description={t('layout:cookies.necessary.description')}
              value
              isReadOnly
            />
            <CheckboxInput
              label={t('layout:cookies.func.displayName')}
              description={t('layout:cookies.func.description')}
              value={functional}
              onChange={setFunctional}
            />
            <CheckboxInput
              label={t('layout:cookies.stats.displayName')}
              description={t('layout:cookies.stats.description')}
              value={statistics}
              onChange={setStatistics}
            />
          </fieldset>
        : <p>
            {t('layout:cookies.description')}{' '}
            <NextLink href="/kakor" className="text-accent underline">
              {t('layout:cookies.read_more')}
            </NextLink>
          </p>
        }
        <div className="flex flex-wrap gap-3">
          {isEditing ?
            <>
              <Button
                ref={saveRef}
                label={t('layout:cookies.save')}
                variant="primary"
                onClick={() => {
                  save(['necessary', ...(functional ? ['func'] : []), ...(statistics ? ['stats'] : [])]);
                }}
              />
              <Button
                label={t('layout:cookies.back')}
                onClick={() => {
                  setIsEditing(false);
                  requestAnimationFrame(() => {
                    manageRef.current?.focus();
                  });
                }}
              />
            </>
          : <>
              <Button
                label={t('layout:cookies.accept_all')}
                variant="primary"
                onClick={() => {
                  save(['necessary', 'func', 'stats']);
                }}
              />
              <Button
                label={t('layout:cookies.accept_necessary')}
                onClick={() => {
                  save(['necessary']);
                }}
              />
              <Button
                ref={manageRef}
                label={t('layout:cookies.manage')}
                variant="ghost"
                onClick={() => {
                  setIsEditing(true);
                }}
              />
            </>
          }
        </div>
      </VStack>
    </Dialog>
  );
};
