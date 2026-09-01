'use client';

import { getErrandsCount } from '@services/errand-service/errand-service';
import { CircleCheckBig, ClipboardPen, SquarePen } from 'lucide-react';
import { createElement, ReactElement, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { appConfig } from 'src/config/appconfig';
import { useErrandCountStore } from 'src/stores/errand-count-store';
import { useFilterStore } from 'src/stores/filter-store';
import { useSortStore } from 'src/stores/sort-store';

export interface StatusButton {
  /** Stabil identitet för listan. Etiketten duger inte: den byter form med språket. */
  key: string;
  label: string;
  statuses: string[];
  icon: ReactElement;
  errandsCount: number;
}

const DEFAULT_STATUS_KEY = 'NEW';

/** Listornas namn, samlat så att både knapparna och rubriken hämtar dem från samma ställe. */
const STATUS_LABEL_KEYS: Record<string, string> = {
  NEW: 'filtering:errands.open',
  DRAFT: 'filtering:errands.draft',
  SOLVED: 'filtering:errands.closed',
};
const STATUS_KEYS = Object.keys(STATUS_LABEL_KEYS);

/**
 * Namnet på listan man tittar på. Egen hook eftersom useStatusButtons hämtar antal: en rubrik
 * som bara vill ha namnet ska inte utlösa en omgång räkneanrop till.
 */
export function useActiveStatusLabel(): string {
  const { t } = useTranslation();
  const activeStatus = useFilterStore((state) => state.activeStatus);
  const labelKey = activeStatus ? STATUS_LABEL_KEYS[activeStatus] : undefined;

  return labelKey ? t(labelKey) : '';
}

export function useStatusButtons() {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const { t } = useTranslation();
  const { activeStatus, setActiveStatus, setStatuses } = useFilterStore();
  const {
    newErrandCount,
    draftErrandCount,
    closedErrandCount,
    setNewErrandCount,
    setDraftErrandCount,
    setClosedErrandCount,
  } = useErrandCountStore();
  const { reset } = useSortStore();
  const draftEnabled = appConfig.features.draftEnabled;

  // Ett sparat val från en tidigare version är en översatt etikett och matchar ingen lista.
  // Det, och ett tomt val, faller tillbaka på den första listan.
  useEffect(() => {
    if (!activeStatus || !STATUS_KEYS.includes(activeStatus)) {
      setActiveStatus(DEFAULT_STATUS_KEY);
      setStatuses([DEFAULT_STATUS_KEY]);
    }
  }, [activeStatus, setActiveStatus, setStatuses]);

  const allStatusButtons: StatusButton[] = [
    {
      key: 'NEW',
      label: t(STATUS_LABEL_KEYS.NEW),
      statuses: ['NEW'],
      icon: createElement(ClipboardPen),
      errandsCount: newErrandCount,
    },
    {
      key: 'DRAFT',
      label: t(STATUS_LABEL_KEYS.DRAFT),
      statuses: ['DRAFT'],
      icon: createElement(SquarePen),
      errandsCount: draftErrandCount,
    },
    {
      key: 'SOLVED',
      label: t(STATUS_LABEL_KEYS.SOLVED),
      statuses: ['SOLVED'],
      icon: createElement(CircleCheckBig),
      errandsCount: closedErrandCount,
    },
  ];

  const statusButtons =
    draftEnabled ? allStatusButtons : allStatusButtons.filter((button) => !button.statuses.includes('DRAFT'));

  useEffect(() => {
    let active = true;
    setIsLoading(true);
    const requests: { status: string; apply: (count: number) => void }[] = [
      { status: 'NEW', apply: setNewErrandCount },
      { status: 'SOLVED', apply: setClosedErrandCount },
    ];
    if (draftEnabled) {
      requests.push({ status: 'DRAFT', apply: setDraftErrandCount });
    }

    void Promise.allSettled(requests.map(({ status }) => getErrandsCount({ statuses: [status] })))
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
  }, [draftEnabled, setClosedErrandCount, setDraftErrandCount, setNewErrandCount, t]);

  const onSelectStatus = (button: StatusButton) => {
    setActiveStatus(button.key);
    setStatuses(button.statuses);
    reset();
  };

  /** Den valda listans namn, för rubriker. Etiketten härleds ur nyckeln och följer språket. */
  const activeStatusLabel = statusButtons.find((button) => button.key === activeStatus)?.label ?? '';

  return { statusButtons, activeStatus, activeStatusLabel, onSelectStatus, isLoading, error };
}
