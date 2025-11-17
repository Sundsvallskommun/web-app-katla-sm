import { getErrands } from '@services/errand-service/errand-service';
import { Table } from '@sk-web-gui/react';
import { useEffect, useState } from 'react';
import { ErrandTableFooter } from './errand-table-footer.component';
import { ErrandTableHeader } from './errand-table-header.component';
import { ErrandDTO } from '@data-contracts/backend/data-contracts';
import { StatusLabel } from '@components/status-label.component';
import dayjs from 'dayjs';
import { useSorteStore } from 'src/stores/sort-store';
import { useFilterStore } from 'src/stores/filter-store';

export const ErrandTable: React.FC = () => {
  const { sortColumn, sortOrder, page, size, rowHeight } = useSorteStore();
  const { statuses } = useFilterStore();

  const [rows, setRows] = useState<ErrandDTO[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  // const [totalElements, setTotalElements] = useState(0);

  useEffect(() => {
    getErrands({ sortColumn, sortOrder, page, size, statuses }).then((data) => {
      setRows(data.content ?? []);
      setTotalPages(data.totalPages ?? 1);
      // setTotalElements(data.totalElements ?? 0);
    });
  }, [sortColumn, sortOrder, page, size, statuses]);

  return (
    <Table dense={rowHeight === 'dense'}>
      <ErrandTableHeader />

      {rows.map((errand, index) => (
        <Table.Row key={`errand-row-${index}`}>
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
