'use client';

import { ErrandTable } from '@components/errand-table/errand-table.component';
import { ErrandFilterQuery } from '@components/filtering/errand-filter-query.component';
import Filtering from '@components/filtering/filtering.component';
import { CenterDiv } from '@layouts/center-div.component';
import FilteringLayout from '@layouts/filtering-layout/filtering-layout.component';
import Main from '@layouts/main/main.component';
import { getMetadata } from '@services/errand-service/errand-service';
import { Button, Link } from '@sk-web-gui/react';
import { ListFilter } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { appConfig } from 'src/config/appconfig';
import { useMetadataStore } from 'src/stores/metadata-store';

const Oversikt: React.FC = () => {
  const { t } = useTranslation();
  const [show, setShow] = useState<boolean>(false);

  const { setMetadata } = useMetadataStore();

  useEffect(() => {
    getMetadata().then((res) => setMetadata(res));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <FilteringLayout>
        <CenterDiv>
          <div className="w-full flex gap-16 max-w-screen-desktop-max items-center">
            <ErrandFilterQuery />
            {appConfig.features.errandFilter && (
              <Button
                onClick={() => setShow(!show)}
                data-cy="Show-filters-button"
                color="vattjom"
                variant={show ? 'tertiary' : 'primary'}
                inverted={show ? false : true}
                leftIcon={<ListFilter size="1.8rem" />}
              >
                {show ? t('filtering:hide_filter') : t('filtering:show_filter')}
              </Button>
            )}
            <Link href={`${process.env.NEXT_PUBLIC_BASE_PATH}/arende/registrera`} data-cy="register-new-errand-button">
              <Button color={'vattjom'} variant={'primary'}>
                {t('filtering:new_errand')}
              </Button>
            </Link>
          </div>

          {show && <Filtering />}
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

export default Oversikt;
