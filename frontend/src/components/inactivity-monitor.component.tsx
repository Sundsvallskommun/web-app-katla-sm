'use client';

import { Button } from '@astryxdesign/core/Button';
import { Dialog, DialogHeader } from '@astryxdesign/core/Dialog';
import { useFocusTrap } from '@astryxdesign/core/hooks';
import { Stack } from '@astryxdesign/core/Stack';
import { Text } from '@astryxdesign/core/Text';
import CountdownTimer from '@components/countdown/countdown-timer.component';
import { AlarmClock } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

const warningTimeout = process.env.NEXT_PUBLIC_INACTIVITY_WARNING_TIMEOUT;
const countdownTimeout = process.env.NEXT_PUBLIC_INACTIVITY_COUNTDOWN_TIMEOUT;
const INACTIVITY_ENABLED = !!(warningTimeout && countdownTimeout);
const WARNING_TIME = parseInt(warningTimeout ?? '0', 10);
const COUNTDOWN_TIME = parseInt(countdownTimeout ?? '0', 10);

export const InactivityMonitor: React.FC = () => {
  const router = useRouter();
  const pathname = usePathname();
  const { t } = useTranslation('session');
  const [showWarning, setShowWarning] = useState(false);
  const isActive = INACTIVITY_ENABLED && !pathname?.includes('login') && !pathname?.includes('logout');
  const isOpen = isActive && showWarning;
  const { containerRef } = useFocusTrap<HTMLDialogElement>({ isActive: isOpen });

  const handleLogout = useCallback(() => {
    setShowWarning(false);
    router.push('/logout');
  }, [router]);
  const handleStayLoggedIn = () => {
    setShowWarning(false);
  };

  // Each phase owns exactly one timer. Showing the warning must not clear the
  // countdown that logs the user out; activity only restarts the pre-warning phase.
  useEffect(() => {
    if (!isActive) return;
    if (showWarning) {
      const countdown = setTimeout(handleLogout, COUNTDOWN_TIME);
      return () => {
        clearTimeout(countdown);
      };
    }

    let warning: ReturnType<typeof setTimeout>;
    const restartWarning = () => {
      clearTimeout(warning);
      warning = setTimeout(() => {
        setShowWarning(true);
      }, WARNING_TIME);
    };
    const events: (keyof DocumentEventMap)[] = ['mousemove', 'keydown', 'scroll', 'touchstart', 'click'];
    events.forEach((event) => {
      document.addEventListener(event, restartWarning);
    });
    restartWarning();
    return () => {
      clearTimeout(warning);
      events.forEach((event) => {
        document.removeEventListener(event, restartWarning);
      });
    };
  }, [isActive, showWarning, handleLogout]);

  if (!INACTIVITY_ENABLED) return null;

  return (
    <Dialog
      ref={containerRef}
      isOpen={isOpen}
      onOpenChange={(open) => {
        if (!open) handleStayLoggedIn();
      }}
      purpose="form"
    >
      <Stack gap={6}>
        <DialogHeader
          title={t('warning_title')}
          onOpenChange={(open) => {
            if (!open) handleStayLoggedIn();
          }}
        />
        <AlarmClock size={32} aria-hidden="true" />
        <Text>
          {t('warning_message')}{' '}
          {isOpen && (
            <strong>
              <CountdownTimer timeout={COUNTDOWN_TIME} />
            </strong>
          )}
          {'. '}
          {t('warning_message_suffix')}
        </Text>
        <Stack direction="horizontal" justify="end" gap={3} wrap="wrap">
          <Button label={t('logout_button')} variant="secondary" onClick={handleLogout} />
          <Button label={t('stay_button')} variant="primary" data-autofocus onClick={handleStayLoggedIn} />
        </Stack>
      </Stack>
    </Dialog>
  );
};
