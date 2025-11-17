import { SortMode, Table } from '@sk-web-gui/react';
import { useSorteStore } from 'src/stores/sort-store';

export const ErrandTableHeader: React.FC = () => {
  const sortOrders: { [key: string]: 'ascending' | 'descending' } = {
    asc: 'ascending',
    desc: 'descending',
  };

  const { sortColumn, sortOrder, setSort } = useSorteStore();

  const headers = [
    {
      label: 'Status',
      property: 'status',
      sortable: true,
      screenReaderOnly: false,
      sticky: true,
    },
    {
      label: 'Ärendetyp',
      property: 'title',
      sortable: true,
      screenReaderOnly: false,
      sticky: false,
    },
    {
      label: 'Registrerat',
      property: 'created',
      sortable: true,
      screenReaderOnly: false,
      sticky: false,
    },
  ];

  return (
    <Table.Header>
      {headers.map((header, index) => {
        const isActive = sortColumn === header.property;

        return (
          <Table.HeaderColumn key={`header-${index}`} sticky={header.sticky}>
            {header.screenReaderOnly ?
              <span className="sr-only">{header.label}</span>
            : header.sortable ?
              <Table.SortButton
                isActive={isActive}
                sortOrder={isActive ? (sortOrders[sortOrder] as SortMode) : null}
                onClick={() => setSort(header.property)}
              >
                {header.label}
              </Table.SortButton>
            : header.label}
          </Table.HeaderColumn>
        );
      })}
    </Table.Header>
  );
};
