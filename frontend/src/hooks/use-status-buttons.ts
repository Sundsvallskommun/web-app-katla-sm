'use client';

import { getErrandsCount } from '@services/errand-service/errand-service';
import { DRAFT_STATUS, getOpenStatuses, SOLVED_STATUS } from '@utils/errand-status';
import { CircleCheckBig, ClipboardPen, SquarePen } from 'lucide-react';
import { createElement, ReactElement, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { appConfig } from 'src/config/appconfig';
import { useErrandCountStore } from 'src/stores/errand-count-store';
import { useFilterStore } from 'src/stores/filter-store';
import { useMetadataStore } from 'src/stores/metadata-store';
import { useSortStore } from 'src/stores/sort-store';

export interface StatusButton {
  /** Stabil identitet för listan. Etiketten duger inte: den byter form med språket. */
  key: string;
  label: string;
  statuses: string[];
  icon: ReactElement;
  errandsCount: number;
}

/**
 * Inskickade är inte en status utan alla som inte är avslutade. Rapportören ska se sin rapport
 * kvar i listan även efter att handläggaren flyttat den vidare i sitt flöde.
 */
const OPEN_STATUS_KEY = 'OPEN';

/** Listornas namn, samlat så att både knapparna och rubriken hämtar dem från samma ställe. */
const STATUS_LABEL_KEYS: Record<string, string> = {
  [OPEN_STATUS_KEY]: 'filtering:errands.open',
  [DRAFT_STATUS]: 'filtering:errands.draft',
  [SOLVED_STATUS]: 'filtering:errands.closed',
};
const STATUS_KEYS = Object.keys(STATUS_LABEL_KEYS);

const toActiveKey = (activeStatus: string | null): string =>
  activeStatus && STATUS_KEYS.includes(activeStatus) ? activeStatus : OPEN_STATUS_KEY;

const isSameStatusList = (a: string[], b: string[]): boolean =>
  a.length === b.length && a.every((status, index) => status === b[index]);

/**
 * Namnet på listan man tittar på. Egen hook eftersom useStatusButtons hämtar antal: en rubrik
 * som bara vill ha namnet ska inte utlösa en omgång räkneanrop till.
 */
export function useActiveStatusLabel(): string {
  const { t } = useTranslation();
  const activeStatus = useFilterStore((state) => state.activeStatus);

  return t(STATUS_LABEL_KEYS[toActiveKey(activeStatus)] ?? '');
}

export function useStatusButtons() {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const { t } = useTranslation();
  const { activeStatus, setActiveStatus, setStatuses } = useFilterStore();
  const statuses = useFilterStore((state) => state.statuses);
  const { metadata } = useMetadataStore();
  const {
    openErrandCount,
    draftErrandCount,
    closedErrandCount,
    setOpenErrandCount,
    setDraftErrandCount,
    setClosedErrandCount,
  } = useErrandCountStore();
  const { reset } = useSortStore();
  const draftEnabled = appConfig.features.draftEnabled;

  // Utkasten hålls utanför Inskickade bara när de har en egen lista att ligga i. Är funktionen
  // avstängd hör de hemma i Inskickade i stället för att bli osynliga.
  const openStatuses = useMemo(
    () => getOpenStatuses(metadata?.statuses, draftEnabled),
    [metadata?.statuses, draftEnabled]
  );
  const activeKey = toActiveKey(activeStatus);

  // Ett sparat val från en tidigare version är en översatt etikett eller en gammal nyckel och
  // matchar ingen lista. Det, och ett tomt val, faller tillbaka på den första listan.
  useEffect(() => {
    if (activeStatus !== activeKey) setActiveStatus(activeKey);
  }, [activeStatus, activeKey, setActiveStatus]);

  // Statuslistan följer det valda alternativet och metadatan. En tom lista skickas aldrig vidare:
  // utan statusfilter skulle även de avslutade ärendena hämtas.
  useEffect(() => {
    const nextStatuses = activeKey === OPEN_STATUS_KEY ? openStatuses : [activeKey];
    if (nextStatuses.length === 0 || isSameStatusList(nextStatuses, statuses)) return;

    setStatuses(nextStatuses);
  }, [activeKey, openStatuses, statuses, setStatuses]);

  const allStatusButtons: StatusButton[] = [
    {
      key: OPEN_STATUS_KEY,
      label: t(STATUS_LABEL_KEYS[OPEN_STATUS_KEY]),
      statuses: openStatuses,
      icon: createElement(ClipboardPen),
      errandsCount: openErrandCount,
    },
    {
      key: DRAFT_STATUS,
      label: t(STATUS_LABEL_KEYS[DRAFT_STATUS]),
      statuses: [DRAFT_STATUS],
      icon: createElement(SquarePen),
      errandsCount: draftErrandCount,
    },
    {
      key: SOLVED_STATUS,
      label: t(STATUS_LABEL_KEYS[SOLVED_STATUS]),
      statuses: [SOLVED_STATUS],
      icon: createElement(CircleCheckBig),
      errandsCount: closedErrandCount,
    },
  ];

  const statusButtons =
    draftEnabled ? allStatusButtons : allStatusButtons.filter((button) => button.key !== DRAFT_STATUS);

  useEffect(() => {
    let active = true;
    const requests: { statuses: string[]; apply: (count: number) => void }[] = [
      { statuses: [SOLVED_STATUS], apply: setClosedErrandCount },
    ];
    // Antalet inskickade går inte att räkna innan metadatan säger vilka statusar som är öppna.
    if (openStatuses.length > 0) {
      requests.unshift({ statuses: openStatuses, apply: setOpenErrandCount });
    }
    if (draftEnabled) {
      requests.push({ statuses: [DRAFT_STATUS], apply: setDraftErrandCount });
    }

    setIsLoading(true);
    void Promise.allSettled(requests.map((request) => getErrandsCount({ statuses: request.statuses })))
      .then((results) => {
        if (!active) return;
        results.forEach((result, index) => {
          if (result.status === 'fulfilled') requests[index]?.apply(result.value.count);
        });
        setError(results.some((result) => result.status === 'rejected') ? t('api_errors.counts') : null);
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [draftEnabled, openStatuses, setClosedErrandCount, setDraftErrandCount, setOpenErrandCount, t]);

  const onSelectStatus = (button: StatusButton) => {
    setActiveStatus(button.key);
    setStatuses(button.statuses);
    reset();
  };

  /** Den valda listans namn, för rubriker. Etiketten härleds ur nyckeln och följer språket. */
  const activeStatusLabel = statusButtons.find((button) => button.key === activeKey)?.label ?? '';

  return { statusButtons, activeStatus: activeKey, activeStatusLabel, onSelectStatus, isLoading, error };
}
