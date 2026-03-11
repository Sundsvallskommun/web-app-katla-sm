import { ErrandFilter } from '@components/errand-filter/errand-filter.component';
import { ErrandTable } from '@components/errand-table/errand-table.component';
import { CenterDiv } from '@layouts/center-div.component';
import FilteringLayout from '@layouts/filtering-layout/filtering-layout.component';
import Main from '@layouts/main/main.component';

export default function Oversikt() {
  return (
    <>
      <FilteringLayout>
        <CenterDiv>
          <ErrandFilter />
        </CenterDiv>
      </FilteringLayout>
      <Main>
        <CenterDiv>
          <div className="w-full max-w-screen-desktop-max">
            <ErrandTable />
          </div>
        </CenterDiv>
      </Main>
    </>
  );
};
