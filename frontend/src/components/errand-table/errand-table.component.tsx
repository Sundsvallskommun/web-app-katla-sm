import { StatusLabel } from '@components/misc/status-label.component';
import { ErrandDTO } from '@data-contracts/backend/data-contracts';
import { CenterDiv } from '@layouts/center-div.component';
import { getErrands } from '@services/errand-service/errand-service';
import { Spinner, Table } from '@sk-web-gui/react';
import dayjs from 'dayjs';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useFilterStore } from 'src/stores/filter-store';
import { useMetadataStore } from 'src/stores/metadata-store';
import { useSortStore } from 'src/stores/sort-store';
import { ErrandTableFooter } from './errand-table-footer.component';
import { ErrandTableHeader } from './errand-table-header.component';

export const ErrandTable: React.FC = () => {
  const { t } = useTranslation();
  const { sortColumn, sortOrder, page, size, rowHeight } = useSortStore();
  const { statuses } = useFilterStore();
  const { metadata } = useMetadataStore();

  const getTypeDisplayName = (errand: ErrandDTO) => {
    const category = metadata?.categories?.find((c) => c.name === errand.classification?.category);
    return category?.types?.find((t) => t.name === errand.classification?.type)?.displayName ?? errand.classification?.type;
  };

  const [rows, setRows] = useState<ErrandDTO[]>([]);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [isLoading, setIsLoading] = useState<boolean>(false);

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
    <Table data-cy="errand-table" dense={rowHeight === 'dense'} className='px-16 md:px-40 overflow-x-auto'>
      <ErrandTableHeader />

      {rows.map((errand, index) => (
        <Table.Row
          key={`errand-row-${index}`}
          tabIndex={0}
          onClick={() =>
            window.open(`${process.env.NEXT_PUBLIC_BASE_PATH}/arende/${errand.errandNumber}/grundinformation`, '_blank')
          }
          onKeyDown={(e: React.KeyboardEvent) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              window.open(
                `${process.env.NEXT_PUBLIC_BASE_PATH}/arende/${errand.errandNumber}/grundinformation`,
                '_blank'
              );
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
