'use client';

import { StatusLabel } from '@components/misc/status-label.component';
import { ErrandDTO } from '@data-contracts/backend/data-contracts';
import { CenterDiv } from '@layouts/center-div.component';
import { getErrands, getMetadata } from '@services/errand-service/errand-service';
import { Spinner, Table } from '@sk-web-gui/react';
import dayjs from 'dayjs';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useFilterStore } from 'src/stores/filter-store';
import { useSortStore } from 'src/stores/sort-store';
import { ErrandTableFooter } from './errand-table-footer.component';
import { ErrandTableHeader } from './errand-table-header.component';
import { useMetadataStore } from 'src/stores/metadata-store';
import { useRouter } from 'next/navigation';

export const ErrandTable: React.FC = () => {
  const { t } = useTranslation();
  const router = useRouter();
  const { sortColumn, sortOrder, page, size, rowHeight } = useSortStore();
  const { statuses } = useFilterStore();

  const getTypeDisplayName = (errand: ErrandDTO) => {
    const hasAdverseIncident = errand.labels?.some((l) => l.resourceName === 'ADVERSE_INCIDENT');
    return hasAdverseIncident ? 'Missförhållande' : 'Avvikelse';
  };

  const [rows, setRows] = useState<ErrandDTO[]>([]);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const { setMetadata } = useMetadataStore();

  useEffect(() => {
    getMetadata().then((res) => setMetadata(res));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setIsLoading(true);
    getErrands({ sortColumn, sortOrder, page, size, statuses }).then((data) => {
      setRows(data.content ?? []);
      setTotalPages(data.totalPages ?? 1);
    });
    setIsLoading(false);
  }, [sortColumn, sortOrder, page, size, statuses]);

  if (isLoading)
    return (
      <CenterDiv className="mt-[20rem]">
        <Spinner />
      </CenterDiv>
    );

  if (rows.length === 0) return <CenterDiv className="mt-[20rem]">{t('errand-information:no_errands')}</CenterDiv>;

  return (
    <Table data-cy="errand-table" dense={rowHeight === 'dense'} className="px-40">
      <ErrandTableHeader />

      {rows.map((errand, index) => (
        <Table.Row
          className="cursor-pointer"
          key={`errand-row-${index}`}
          tabIndex={0}
          onClick={() => router.push(`/arende/${errand.errandNumber}/grundinformation`)}
          onKeyDown={(e: React.KeyboardEvent) => {
            if (e.key === 'Enter') {
              router.push(`/arende/${errand.errandNumber}/grundinformation`);
            }
          }}
        >
          <Table.Column>
            <StatusLabel status={errand?.status} />
          </Table.Column>
          <Table.Column>{errand.errandNumber}</Table.Column>
          <Table.Column>{getTypeDisplayName(errand)}</Table.Column>
          <Table.Column>{dayjs(errand.touched).format('YYYY-MM-DD HH:mm')}</Table.Column>
        </Table.Row>
      ))}

      <Table.Footer>
        <ErrandTableFooter totalPages={totalPages} />
      </Table.Footer>
    </Table>
  );
};
