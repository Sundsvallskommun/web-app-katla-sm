'use client';

import { LinkButton } from '@components/navigation/link-button.component';
import { Link } from '@sk-web-gui/react';
import { withBasePath } from '@utils/base-path';
import { ArrowLeft, Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { appConfig } from 'src/config/appconfig';

import { userGuideManifest } from './user-guide-manifest';
import { UserGuideStep } from './user-guide-step.component';
import { isGuideItemVisible, USER_GUIDE_APPENDIX, USER_GUIDE_STEPS } from './user-guide-steps';
import { UserGuideText } from './user-guide-text.component';
import { UserGuideToc } from './user-guide-toc.component';

const BEFORE_YOU_START_KEYS = ['before_you_start.what', 'before_you_start.person_number', 'before_you_start.others'];

/** Datumet bilderna togs, skrivet som på svenska respektive engelska ("7 oktober 2026"). */
const formatGeneratedAt = (generatedAt: string, locale: string): string | null =>
  generatedAt ?
    new Intl.DateTimeFormat(locale, { dateStyle: 'long', timeZone: 'UTC' }).format(new Date(generatedAt))
  : null;

/**
 * Användarguiden "Så rapporterar du en avvikelse": steg för steg från översikten till kvittot,
 * med skärmbilder ur det riktiga flödet och pilar mot det man ska klicka på.
 */
export const UserGuide: React.FC = () => {
  const { t, i18n } = useTranslation('user-guide');
  const steps = USER_GUIDE_STEPS.filter((step) => isGuideItemVisible(step, appConfig.features));
  const appendix = USER_GUIDE_APPENDIX.filter((section) => isGuideItemVisible(section, appConfig.features));
  const generatedAt = formatGeneratedAt(userGuideManifest.generatedAt, i18n.resolvedLanguage ?? 'sv');

  return (
    <div className="mx-auto flex w-full max-w-[128rem] flex-col gap-40 px-16 py-32 md:px-40 md:py-48">
      <Link href={withBasePath('/oversikt')} className="inline-flex w-fit items-center gap-8">
        <ArrowLeft aria-hidden="true" size={18} />
        {t('back_to_overview')}
      </Link>

      <header className="flex max-w-[72rem] flex-col gap-16">
        <h1 className="text-h2-sm md:text-h1-md text-dark-primary">{t('title')}</h1>
        <p className="text-lead">
          <UserGuideText textKey="intro" />
        </p>
      </header>

      <div className="flex flex-col gap-48 xl:grid xl:grid-cols-[26rem_minmax(0,1fr)] xl:items-start xl:gap-64">
        <div className="flex flex-col gap-32 xl:sticky xl:top-24">
          <UserGuideToc steps={steps} appendix={appendix} />
        </div>

        <div className="flex min-w-0 flex-col gap-64">
          <section
            aria-labelledby="before-you-start-heading"
            className="bg-background-color-mixin-1 rounded-utility flex max-w-[72rem] flex-col gap-12 p-24"
          >
            <h2 id="before-you-start-heading" className="text-h4-sm text-dark-primary">
              {t('before_you_start.title')}
            </h2>
            <ul className="flex list-disc flex-col gap-8 pl-24">
              {BEFORE_YOU_START_KEYS.map((key) => (
                <li key={key}>
                  <UserGuideText textKey={key} />
                </li>
              ))}
            </ul>
          </section>

          {steps.map((step, index) => (
            <UserGuideStep key={step.id} step={step} number={index + 1} />
          ))}

          {appendix.map((section) => (
            <UserGuideStep key={section.id} step={section} />
          ))}

          <section
            aria-labelledby="ready-heading"
            className="bg-vattjom-background-200 rounded-utility flex flex-col items-start gap-16 p-24 md:p-32"
          >
            <h2 id="ready-heading" className="text-h3-sm md:text-h3-md text-dark-primary">
              {t('ready.title')}
            </h2>
            <p>
              <UserGuideText textKey="ready.text" />
            </p>
            <LinkButton
              href="/arende/registrera"
              variant="primary"
              color="vattjom"
              leftIcon={<Plus aria-hidden="true" />}
              data-cy="user-guide-new-report"
            >
              {t('filtering:new_errand_mobile')}
            </LinkButton>
          </section>

          {generatedAt && (
            <p className="text-small text-dark-secondary">{t('screenshots_updated', { date: generatedAt })}</p>
          )}
        </div>
      </div>
    </div>
  );
};
