import { Table } from '@sk-web-gui/react';
import { ErrandTableFooter } from './errand-table-footer.component';
import { ErrandTableHeader } from './errand-table-header.component';
// import { FormProvider } from 'react-hook-form';

export const ErrandTable: React.FC = () => {
  //   const headers: Array<AutoTableHeader | string> = [
  //     {
  //       label: 'Status',
  //       property: 'status',
  //       sticky: true,
  //       renderColumn: (status) => <StatusLabel status={status}/>
  //     },
  //     {
  //       label: 'Ärendetyp',
  //       property: 'classification.category',
  //       renderColumn: (value) => <strong>{value}</strong>
  //     },
  //     {
  //       label: 'Registrerat',
  //       property: 'created',
  //       renderColumn: (timestamp) => <>{dayjs(timestamp).format('YYYY-MM-DD, HH:mm')}</>
  //     },
  //   ];

  return (
    <Table>
      <ErrandTableHeader />
      <Table.Footer>
        <ErrandTableFooter />
      </Table.Footer>
    </Table>
  );
};
