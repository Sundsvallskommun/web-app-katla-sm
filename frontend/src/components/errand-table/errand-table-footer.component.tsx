import { Input, Pagination, Select } from '@sk-web-gui/react';
import { useSorteStore } from 'src/stores/sort-store';

export const ErrandTableFooter: React.FC<{ totalPages: number }> = ({ totalPages }) => {
  const { page, size, rowHeight, setRowHeight } = useSorteStore();
  const setPage = useSorteStore((s) => s.setPage);
  const setSize = useSorteStore((s) => s.setSize);

  return (
    <>
      <div className="sk-table-bottom-section">
        <label className="sk-table-bottom-section-label" htmlFor="pageSize">
          Rader per sida:
        </label>
        <Input
          size="sm"
          id="pageSize"
          type="number"
          min={1}
          max={100}
          className="max-w-[6rem]"
          value={size}
          onChange={(e) => {
            const v = Number(e.target.value) || 1;
            setSize(v);
          }}
        />
      </div>
      <div className="sk-table-paginationwrapper">
        <Pagination
          showFirst
          showLast
          pagesBefore={1}
          pagesAfter={1}
          showConstantPages={true}
          fitContainer
          pages={totalPages}
          activePage={page}
          changePage={(p: number) => setPage(p)}
        />
      </div>
      <div className="sk-table-bottom-section">
        <label className="sk-table-bottom-section-label" htmlFor="rowHeight">
          Radhöjd:
        </label>
        <Select size="sm" id="rowHeight" variant="tertiary" onChange={(e) => setRowHeight(e.target.value)} value={rowHeight}>
          <Select.Option value="normal">Normal</Select.Option>
          <Select.Option value="dense">Tät</Select.Option>
        </Select>
      </div>
    </>
  );
};
