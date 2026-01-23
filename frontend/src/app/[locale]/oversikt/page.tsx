'use client';

import { ErrandTable } from '@components/errand-table/errand-table.component';
import { ErrandFilterQuery } from '@components/filtering/errand-filter-query.component';
import Filtering from '@components/filtering/filtering.component';
import { CenterDiv } from '@layouts/center-div.component';
import FilteringLayout from '@layouts/filtering-layout/filtering-layout.component';
import Main from '@layouts/main/main.component';
import { getMetadata } from '@services/errand-service/errand-service';
import { useUserStore } from '@services/user-service/user-service';
import LucideIcon from '@sk-web-gui/lucide-icon';
import { Button, Link } from '@sk-web-gui/react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useMetadataStore } from 'src/stores/metadata-store';
import { useShallow } from 'zustand/react/shallow';

const Oversikt: React.FC = () => {
  const user = useUserStore(useShallow((s) => s.user));
  const { t } = useTranslation();
  console.log('user', user);
  const [show, setShow] = useState<boolean>(false);

  const { setMetadata } = useMetadataStore();

  useEffect(() => {
    console.log('GETTING METADATA');
    getMetadata().then((res) => setMetadata(res));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <FilteringLayout>
        <CenterDiv>
          <div className="w-full flex gap-16 max-w-screen-desktop-max items-center">
            <ErrandFilterQuery />

            <Button
              onClick={() => setShow(!show)}
              data-cy="Show-filters-button"
              color="vattjom"
              variant={show ? 'tertiary' : 'primary'}
              inverted={show ? false : true}
              leftIcon={<LucideIcon name="list-filter" size="1.8rem" />}
            >
              {show ? t('filtering:hide_filter') : t('filtering:show_filter')}
              {/* {show ? 'Dölj filter' : `Visa filter ${numberOfFilters !== 0 ? `(${numberOfFilters})` : ''}`} */}
            </Button>
            <Link
              href={`${process.env.NEXT_PUBLIC_BASE_PATH}/arende/registrera`}
              target="_blank"
              data-cy="register-new-errand-button"
            >
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

{
  /* <DefaultLayout>
      <Main>
        <div className="text-content">
          <h1>{`${capitalize(t('example:welcome'))}${user.name ? ` ${user.name}` : ''}!`}</h1>
          <p>{t('example:description')}</p>
          {user.name ?
            <NextLink href={`/logout`}>
              <Link as="span" variant="link">
                {capitalize(t('common:logout'))}
              </Link>
            </NextLink>
          : ''}
        </div>
      </Main>
    </DefaultLayout> */
}
