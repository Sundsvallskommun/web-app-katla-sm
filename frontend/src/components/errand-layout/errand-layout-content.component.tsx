'use client';

import { pathWithoutLocale } from '@app/locale-path';
import { Button } from '@astryxdesign/core/Button';
import { Heading } from '@astryxdesign/core/Heading';
import { useMediaQuery } from '@astryxdesign/core/hooks';
import { Layout, LayoutContent } from '@astryxdesign/core/Layout';
import { Stack } from '@astryxdesign/core/Stack';
import { Tab, TabList } from '@astryxdesign/core/TabList';
import { Text } from '@astryxdesign/core/Text';
import { jsonParametersToErrandFormData } from '@components/json/utils/schema-utils';
import { ErrorAlertList } from '@components/misc/error-alert.component';
import { StatusLabel } from '@components/misc/status-label.component';
import { getVisibleTabs } from '@components/tabs/tabs';
import { MobileWizard } from '@components/wizard/mobile-wizard.component';
import { ErrandSubmissionProvider } from '@contexts/errand-submission-provider';
import { FormValidationProvider } from '@contexts/form-validation-provider';
import { yupResolver } from '@hookform/resolvers/yup';
import { ErrandFormDTO } from '@interfaces/errand-form';
import BaseErrandLayout from '@layouts/base-errand-layout/base-errand-layout.component';
import { ErrandButtonGroup } from '@layouts/errand-button-group.component';
import { getErrandUsingErrandNumber } from '@services/errand-service/errand-service';
import { ErrandFormHandover, takeErrandFormHandover } from '@utils/errand-form-handover';
import { ArrowLeft } from 'lucide-react';
import { redirect, useParams, usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { FormProvider, Resolver, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { appConfig } from 'src/config/appconfig';
import { MOBILE_BREAKPOINT } from 'src/constants/responsive';
import { useAutoInitReporter } from 'src/hooks/use-auto-init-reporter';
import { useLoadMetadata } from 'src/hooks/use-load-metadata';
import { useUnsavedReportWarning } from 'src/hooks/use-unsaved-report-warning';
import { useMetadataStore } from 'src/stores/metadata-store';
import { useWizardStore } from 'src/stores/wizard-store';
import * as yup from 'yup';

import { ErrandContentSkeleton } from './errand-content-skeleton.component';

const ReporterInit: React.FC = () => {
  useAutoInitReporter();
  return null;
};

/** Måste ligga innanför FormProvider för att se formuläret, precis som ReporterInit. */
const UnsavedReportWarning: React.FC = () => {
  useUnsavedReportWarning();
  return null;
};

const FormSchema = yup.object({}).required();
const REGISTER_ROUTE_IDENTITY = 'new-errand';
const SUBMITTED_ROUTE_IDENTITY = 'submitted-errand';
const INVALID_ROUTE_IDENTITY = 'invalid-errand-route';
const REGISTER_ROUTE_PATTERN = /\/arende\/registrera\/?$/;
// Kvittot ligger under /arende för att behålla rapporteringens sidhuvud och innehållsyta.
// Det laddar inget ärende: rapporten är inskickad och sidan bär bara beskedet.
const SUBMITTED_ROUTE_PATTERN = /\/arende\/inskickad\/?$/;

type ErrandRoute =
  | { identity: typeof REGISTER_ROUTE_IDENTITY; kind: 'register' }
  | { identity: typeof SUBMITTED_ROUTE_IDENTITY; kind: 'submitted' }
  | { errandNumber: string; identity: string; kind: 'existing' }
  | { identity: typeof INVALID_ROUTE_IDENTITY; kind: 'invalid' };

// Kontrollen finns för att avvisa svar från en tidigare route, inte för att
// kräva kanonisk skiftlägesform. Jämför normaliserat så att en giltig djuplänk
// med annan skiftlägesform fortfarande laddar ärendet.
const matchesRequestedErrand = (errandNumber: string | undefined, requestedErrandNumber: string): boolean =>
  errandNumber?.trim().toLocaleUpperCase('sv-SE') === requestedErrandNumber.trim().toLocaleUpperCase('sv-SE');

const createDefaultErrand = (): ErrandFormDTO => ({
  ...appConfig.katla?.errandDefaults,
  status: 'DRAFT',
});

interface ErrandRouteContentProps {
  children: React.ReactNode;
  route: ErrandRoute;
}

const ErrandRouteContent: React.FC<ErrandRouteContentProps> = ({ children, route }) => {
  const { t } = useTranslation();
  const registerNewErrand = route.kind === 'register';
  // Kvittot delar rapporteringens skal — sidhuvud och innehållsyta — men inga åtgärder:
  // rapporten är inskickad, så det finns inget kvar att spara eller skicka.
  const submittedView = route.kind === 'submitted';
  const requestedErrandNumber = route.kind === 'existing' ? route.errandNumber : null;
  const isMobile = useMediaQuery(MOBILE_BREAKPOINT);
  const wizardReset = useWizardStore((s) => s.reset);
  const wizardGoToStep = useWizardStore((s) => s.goToStep);
  const pathname = usePathname();
  const handoverRef = useRef<{ handover: ErrandFormHandover | null; path: string } | null>(null);
  const { metadataError, metadataLoadState } = useLoadMetadata();
  const metadata = useMetadataStore((state) => state.metadata);
  const [loadState, setLoadState] = useState<'error' | 'loading' | 'ready'>(
    route.kind === 'register' || route.kind === 'submitted' ? 'ready'
    : route.kind === 'invalid' ? 'error'
    : 'loading'
  );

  const tabs = getVisibleTabs(requestedErrandNumber ?? '').filter((tab) => tab.visible);
  const currentPath = pathWithoutLocale(pathname);
  const activeTabIndex = Math.max(
    tabs.findIndex((tab) => currentPath.startsWith(tab.path)),
    0
  );

  const methods = useForm<ErrandFormDTO>({
    resolver: yupResolver(FormSchema) as unknown as Resolver<ErrandFormDTO>,
    defaultValues: createDefaultErrand(),
    mode: 'onSubmit',
  });
  const { reset } = methods;

  useEffect(() => {
    // Ett språkbyte är en navigering, och Next monterar om hela trädet. Överlämningen bär
    // det som bara låg i minnet över den navigeringen; utan den kostar ett språkbyte mitt i
    // registreringen allt användaren fyllt i.
    //
    // Posten tas bort vid första läsningen, medan effekten kan köras om för samma sida –
    // StrictMode gör det i utvecklingsläge. Svaret sparas därför per sökväg: en omkörning
    // för samma sida återanvänder det, och ett flikbyte till en annan sökväg får sitt eget
    // (tomma) svar i stället för att applicera om värden som hunnit bli inaktuella.
    const handoverPath = pathWithoutLocale(pathname);
    if (handoverRef.current?.path !== handoverPath) {
      handoverRef.current = { path: handoverPath, handover: takeErrandFormHandover(handoverPath) };
    }
    const handover = handoverRef.current.handover;

    if (registerNewErrand) {
      if (handover) {
        reset(handover.values);
        wizardGoToStep(handover.wizardStep);
      } else {
        wizardReset();
      }
      return;
    }

    if (!requestedErrandNumber) return;

    let active = true;
    void getErrandUsingErrandNumber(requestedErrandNumber)
      .then((errand) => {
        if (!active) return;
        if (!matchesRequestedErrand(errand.errandNumber, requestedErrandNumber)) {
          throw new Error('Det hämtade ärendet matchar inte den begärda routen');
        }

        const errandFormData = jsonParametersToErrandFormData(errand.jsonParameters);
        // Överlämningen innehåller osparade ändringar och är därmed nyare än svaret från
        // API:et, som bara bär det som hunnit sparas.
        if (handover) {
          reset(handover.values);
          wizardGoToStep(handover.wizardStep);
        } else {
          wizardReset();
          reset({ ...errand, errandFormData });
        }
        setLoadState('ready');
      })
      .catch(() => {
        if (active) setLoadState('error');
      });

    return () => {
      active = false;
    };
  }, [pathname, registerNewErrand, requestedErrandNumber, reset, wizardGoToStep, wizardReset]);

  const errandStatus = methods.watch('status');
  const errandNumber = methods.watch('errandNumber');
  const isDraft = errandStatus === 'DRAFT';
  // Ett utkast är samma oavslutade arbete oavsett om det just skapats eller
  // återupptagits, och wizarden är det gränssnitt som är byggt för smal skärm.
  // Utan det här villkoret bytte ett återupptaget utkast till flikvyn på mobil.
  // Utkastets standardstatus är DRAFT, så kvittot måste undantas explicit — annars
  // öppnas wizarden ovanpå beskedet på mobil.
  const showMobileWizard = isMobile && !submittedView && (registerNewErrand || isDraft);

  const getHeaderTitle = () => {
    if (registerNewErrand) {
      return t('errand-information:new_report');
    }
    if (isDraft) {
      return `${t('errand-information:draft')} ${errandNumber}`;
    }
    return `${t('errand-information:errand')} ${errandNumber}`;
  };

  // Rollnamn och platsstrukturen kommer ur metadata. Renderas sidan innan den
  // finns blir rollerna tomma och platsväljaren fastnar i sitt laddningsläge,
  // så metadata hör till samma readiness-gräns som själva ärendet.
  const loadErrors = [loadState === 'error' ? t('api_errors.errand') : null, metadataError].filter(
    (message): message is string => message !== null
  );

  const isReady = loadErrors.length === 0 && loadState === 'ready' && metadataLoadState === 'ready' && !!metadata;

  return (
    <FormProvider {...methods}>
      <FormValidationProvider>
        <ErrandSubmissionProvider>
          {isReady && registerNewErrand && <ReporterInit />}
          {/* Bara registreringen: där är allt innehåll osparat. Ett laddat utkast bär redan
            sparade värden, så "har innehåll" skulle varna för att lämna en orörd sida. */}
          {isReady && registerNewErrand && <UnsavedReportWarning />}
          <BaseErrandLayout registerNewErrand={registerNewErrand || submittedView}>
            {!isReady ?
              <Layout height="auto" contentWidth={960} padding={4}>
                <LayoutContent isScrollable={false}>
                  <Stack gap={6}>
                    <Text role="status" className="sr-only">
                      {loadErrors.length === 0 ? t('forms:loading') : ''}
                    </Text>
                    {loadErrors.length > 0 ?
                      <ErrorAlertList messages={loadErrors} />
                    : <Stack role="region" aria-label={t('forms:loading')} aria-busy="true">
                        <ErrandContentSkeleton />
                      </Stack>
                    }
                  </Stack>
                </LayoutContent>
              </Layout>
            : showMobileWizard ?
              <MobileWizard />
            : <Layout height="auto" contentWidth={960} padding={isMobile ? 4 : 6}>
                <LayoutContent isScrollable={false}>
                  <Stack gap={6}>
                    {!submittedView && (
                      <Stack gap={4}>
                        {!registerNewErrand && (
                          <Button
                            href="/oversikt"
                            variant="ghost"
                            className="self-start"
                            icon={<ArrowLeft aria-hidden="true" />}
                            label={t('filtering:my_reports')}
                          />
                        )}
                        <Stack direction="horizontal" align="center" justify="between" wrap="wrap" gap={3}>
                          <Stack gap={2} align="start">
                            <Heading level={1}>{getHeaderTitle()}</Heading>
                            {!registerNewErrand && <StatusLabel status={errandStatus} />}
                          </Stack>
                          <ErrandButtonGroup isNewErrand={registerNewErrand} />
                        </Stack>
                      </Stack>
                    )}
                    {!registerNewErrand && !submittedView && (
                      <TabList
                        value={tabs[activeTabIndex]?.path ?? ''}
                        onChange={() => undefined}
                        aria-label={getHeaderTitle()}
                        hasDivider
                        size="lg"
                      >
                        {tabs.map((tab) => (
                          <Tab key={tab.path} value={tab.path} label={t(tab.labelKey)} href={tab.path} />
                        ))}
                      </TabList>
                    )}
                    {children}
                  </Stack>
                </LayoutContent>
              </Layout>
            }
          </BaseErrandLayout>
        </ErrandSubmissionProvider>
      </FormValidationProvider>
    </FormProvider>
  );
};

export const ErrandLayoutContent: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const pathName = usePathname();
  const { errandnumber } = useParams<{ errandnumber?: string }>();
  if (appConfig.mode === 'catalogue') redirect('/katlor');

  let route: ErrandRoute;
  if (REGISTER_ROUTE_PATTERN.test(pathName)) {
    route = { identity: REGISTER_ROUTE_IDENTITY, kind: 'register' };
  } else if (SUBMITTED_ROUTE_PATTERN.test(pathName)) {
    route = { identity: SUBMITTED_ROUTE_IDENTITY, kind: 'submitted' };
  } else if (errandnumber) {
    route = { errandNumber: errandnumber, identity: `existing:${errandnumber}`, kind: 'existing' };
  } else {
    route = { identity: INVALID_ROUTE_IDENTITY, kind: 'invalid' };
  }

  // En routeidentitet äger exakt en RHF-instans. Nyckeln river ned föregående
  // formulär synkront vid A→B-navigation, innan B hinner rendera header eller
  // åtgärder, medan requestupprensningen avvisar varje sent A-svar.
  return (
    <ErrandRouteContent key={route.identity} route={route}>
      {children}
    </ErrandRouteContent>
  );
};
