import { Table } from '@sk-web-gui/react';
// import { FormProvider } from 'react-hook-form';

export const ErrandTableHeader: React.FC = () => {
  const headers = [
    {
      label: 'Status',
      property: 'status',
      sortable: false,
      screenReaderOnly: false,
      sticky: true,
    },
    {
      label: 'Ärendetyp',
      property: 'classification.category',
      sortable: false,
      screenReaderOnly: false,
      sticky: false,
    },
    {
      label: 'Registrerat',
      property: 'created',
      sortable: false,
      screenReaderOnly: false,
      sticky: false,
    },
  ];

  //       const headers = useOngoingSupportErrandLabels(selectedSupportErrandStatuses).map((header, index) => (
  //     <Table.HeaderColumn key={`header-${index}`} sticky={true}>
  //       {header.screenReaderOnly ? (
  //         <span className="sr-only">{header.label}</span>
  //       ) : header.sortable ? (
  //         <Table.SortButton
  //           isActive={
  //             isKC() ? sortColumn === serverSideSortableColsKC[index] : sortColumn === serverSideSortableColsLOP[index]
  //           }
  //           sortOrder={sortOrders[sortOrder] as SortMode}
  //           onClick={() => handleSort(index)}
  //         >
  //           {header.label}
  //         </Table.SortButton>
  //       ) : (
  //         header.label
  //       )}
  //     </Table.HeaderColumn>
  //   ));

  return (
    <Table.Header>
      {headers.map((header, index) => (
        <Table.HeaderColumn key={`header-${index}`} sticky={header.sticky}>
          {header.screenReaderOnly ?
            <span className="sr-only">{header.label}</span>
          : header.sortable ?
            <Table.SortButton isActive={false} sortOrder={null} onClick={() => {}}>
              {header.label}
            </Table.SortButton>
          : header.label}
        </Table.HeaderColumn>
      ))}
    </Table.Header>
  );
};
