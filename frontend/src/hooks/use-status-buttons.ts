'use client';

import { DRAFT_STATUS, getOpenStatuses, SOLVED_STATUS } from '@utils/errand-status';
import { useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { appConfig } from 'src/config/appconfig';
import { useFilterStore } from 'src/stores/filter-store';
import { useMetadataStore } from 'src/stores/metadata-store';
import { useSortStore } from 'src/stores/sort-store';

interface StatusButton {
  /** Stabil identitet för listan. Etiketten duger inte: den byter form med språket. */
  key: string;
  label: string;
  statuses: string[];
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

/** Reads the label without installing another status-selection effect. */
export function useActiveStatusLabel(): string {
  const { t } = useTranslation();
  const activeStatus = useFilterStore((state) => state.activeStatus);

  return t(STATUS_LABEL_KEYS[toActiveKey(activeStatus)] ?? '');
}

export function useStatusButtons() {
  const { t } = useTranslation();
  const { activeStatus, setActiveStatus, setStatuses } = useFilterStore();
  const statuses = useFilterStore((state) => state.statuses);
  const { metadata } = useMetadataStore();
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
    },
    {
      key: DRAFT_STATUS,
      label: t(STATUS_LABEL_KEYS[DRAFT_STATUS]),
      statuses: [DRAFT_STATUS],
    },
    {
      key: SOLVED_STATUS,
      label: t(STATUS_LABEL_KEYS[SOLVED_STATUS]),
      statuses: [SOLVED_STATUS],
    },
  ];

  const statusButtons =
    draftEnabled ? allStatusButtons : allStatusButtons.filter((button) => button.key !== DRAFT_STATUS);

  const onSelectStatus = (button: StatusButton) => {
    setActiveStatus(button.key);
    setStatuses(button.statuses);
    reset();
  };

  return { statusButtons, activeStatus: activeKey, onSelectStatus };
}
