import { Input, Pagination, Select } from '@sk-web-gui/react';
// import { FormProvider } from 'react-hook-form';

export const ErrandTableFooter: React.FC = () => {
  const pages = 1;

  return (
    <>
      <div className="sk-table-bottom-section">
        <label className="sk-table-bottom-section-label" htmlFor="pageSize">
          Rader per sida:
        </label>
        <Input size="sm" id="pageSize" type="number" min={1} max={1000} className="max-w-[6rem]" />
      </div>
      <div className="sk-table-paginationwrapper">
        <Pagination
          showFirst
          showLast
          pagesBefore={1}
          pagesAfter={1}
          showConstantPages={true}
          fitContainer
          pages={1}
          activePage={pages + 1}
          changePage={() => {
            // setValue('page', page - 1);
          }}
        />
      </div>
      <div className="sk-table-bottom-section">
        <label className="sk-table-bottom-section-label" htmlFor="rowHeight">
          Radhöjd:
        </label>
        <Select size="sm" id="rowHeight" variant="tertiary" onChange={() => {}} value={''}>
          <Select.Option value="normal">Normal</Select.Option>
          <Select.Option value="dense">Tät</Select.Option>
        </Select>
      </div>
    </>
  );
};
