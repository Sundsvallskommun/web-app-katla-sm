import { StatusLabel } from '@components/misc/status-label.component';
import { ErrandDTO } from '@data-contracts/backend/data-contracts';
import { CenterDiv } from '@layouts/center-div.component';
import { getErrands } from '@services/errand-service/errand-service';
import { Spinner, Table } from '@sk-web-gui/react';
import dayjs from 'dayjs';
import { useEffect, useState } from 'react';
import { useFilterStore } from 'src/stores/filter-store';
import { useSorteStore } from 'src/stores/sort-store';
import { ErrandTableFooter } from './errand-table-footer.component';
import { ErrandTableHeader } from './errand-table-header.component';
import { useTranslation } from 'react-i18next';

export const ErrandTable: React.FC = () => {
  const { t } = useTranslation();
  const { sortColumn, sortOrder, page, size, rowHeight } = useSorteStore();
  const { statuses } = useFilterStore();

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
    <Table dense={rowHeight === 'dense'}>
      <ErrandTableHeader />

      {rows.map((errand, index) => (
        <Table.Row
          key={`errand-row-${index}`}
          onClick={() =>
            window.open(`${process.env.NEXT_PUBLIC_BASE_PATH}/arende/${errand.errandNumber}/grundinformation`, '_blank')
          }
        >
          <Table.Column>
            <StatusLabel status={errand?.status} />
          </Table.Column>
          <Table.Column>{errand.title}</Table.Column>
          <Table.Column>{dayjs(errand.touched).format('YYYY-MM-DD HH:mm')}</Table.Column>
        </Table.Row>
      ))}

      <Table.Footer>
        <ErrandTableFooter totalPages={totalPages} />
      </Table.Footer>
    </Table>
  );
};
