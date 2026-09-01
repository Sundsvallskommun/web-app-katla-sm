'use client';

import { ErrorAlertList } from '@components/misc/error-alert.component';
import { StatusLabel } from '@components/misc/status-label.component';
import { LinkButton } from '@components/navigation/link-button.component';
import { CenterDiv } from '@layouts/center-div.component';
import { Spinner, Table } from '@sk-web-gui/react';
import { getTypeDisplayName } from '@utils/errand-helpers';
import dayjs from 'dayjs';
import { ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { useOverviewErrands } from 'src/hooks/use-overview-errands';
import { useSortStore } from 'src/stores/sort-store';

import { ErrandTableFooter } from './errand-table-footer.component';
import { ErrandTableHeader } from './errand-table-header.component';

export const ErrandTable: React.FC = () => {
  const { t } = useTranslation();
  const router = useRouter();
  const { rowHeight } = useSortStore();
  const { rows, isLoading, totalPages, totalElements, errandsError, metadataError } = useOverviewErrands();

  const errors = [metadataError, errandsError].filter((message): message is string => message !== null);

  if (isLoading && rows.length === 0)
    return (
      <CenterDiv className="mt-[20rem]">
        <div role="status" aria-live="polite">
          <Spinner aria-hidden="true" />
          <span className="sr-only">{t('common:errand-table.loading')}</span>
        </div>
      </CenterDiv>
    );

  if (rows.length === 0 && errors.length === 0)
    return <CenterDiv className="mt-[20rem]">{t('errand-information:no_errands')}</CenterDiv>;

  return (
    <div className="flex flex-col gap-16">
      <ErrorAlertList messages={errors} />
      {rows.length > 0 && (
        <>
          <p className="text-dark-secondary" data-cy="errand-count">
            {t('filtering:showing_count', { count: totalElements })}
          </p>
          <Table data-cy="errand-table" dense={rowHeight === 'dense'}>
            <ErrandTableHeader />

            <Table.Body>
              {rows.map((errand, index) => {
                const errandUrl = `/arende/${errand.errandNumber}/grundinformation`;

                return (
                  <Table.Row
                    key={`errand-row-${index}`}
                    className="cursor-pointer"
                    // Hela raden öppnar ärendet för den som pekar. Pilen är kvar som riktig länk:
                    // den är det som går att nå med tangentbord och som skärmläsaren annonserar.
                    onClick={() => {
                      router.push(errandUrl);
                    }}
                  >
                    <Table.Column>{getTypeDisplayName(errand, t)}</Table.Column>
                    <Table.Column>
                      <StatusLabel status={errand?.status} />
                    </Table.Column>
                    <Table.Column>{errand.errandNumber}</Table.Column>
                    <Table.Column>{dayjs(errand.created).format('YYYY-MM-DD, HH:mm')}</Table.Column>
                    <Table.Column className="justify-end">
                      <LinkButton
                        href={errandUrl}
                        data-cy="open-errand-button"
                        aria-label={t('common:errand-table.open_errand', { errandNumber: errand.errandNumber })}
                        iconButton
                        variant="tertiary"
                        // Pilen står för sig själv i designen; en knappyta ritar en ruta runt den.
                        showBackground={false}
                        leftIcon={<ArrowRight aria-hidden="true" />}
                      />
                    </Table.Column>
                  </Table.Row>
                );
              })}
            </Table.Body>

            <Table.Footer>
              <ErrandTableFooter totalPages={totalPages} />
            </Table.Footer>
          </Table>
        </>
      )}
    </div>
  );
};
