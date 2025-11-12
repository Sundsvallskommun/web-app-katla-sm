'use client';
import { VisibleTabs } from '@components/tabs/tabs';
import BaseErrandLayout from '@layouts/base-errand-layout/base-errand-layout.component';
import Main from '@layouts/main/main.component';
import { Tabs } from '@sk-web-gui/react';
// import BaseErrandLayout from '@common/components/layout/layout.component';
// import { yupResolver } from '@hookform/resolvers/yup';
// import { defaultSupportErrandInformation, SupportErrand } from '@supportmanagement/services/support-errand-service';
import { default as NextLink } from 'next/link';
import { useRef } from 'react';

// let FormSchema = yup
//   .object({
//     id: yup.string(),
//     category: yup.string().required('Välj ärendekategori'),
//     type: yup.string().required('Välj ärendetyp'),
//     channel: yup.string().required('Välj kanal'),
//     description: yup.string(),
//     parameters: yup.array(),
//   })
//   .required();

export default function ErrandLayout({ children }: { children: React.ReactNode }) {
  const initialFocus = useRef<HTMLBodyElement>(null);
  const setInitalFocus = () => {
    setTimeout(() => {
      // eslint-disable-next-line @typescript-eslint/no-unused-expressions
      initialFocus.current && initialFocus.current.focus();
    });
  };

  //   const supportManagementMethods = useForm<SupportErrand>({
  //     resolver: yupResolver(FormSchema),
  //     defaultValues: defaultSupportErrandInformation,
  //     mode: 'onSubmit',
  //   });

  //   useEffect(() => {
  //     getMe().then((user) => setUser(user));
  //     getAdminUsers().then((data) => setAdministrators(data));
  //     setMunicipalityId(process.env.NEXT_PUBLIC_MUNICIPALITY_ID);
  //     // eslint-disable-next-line react-hooks/exhaustive-deps
  //   }, []);

  return (
    <>
      <NextLink
        href="#content"
        passHref
        tabIndex={1}
        onClick={() => setInitalFocus()}
        className="sr-only focus:not-sr-only bg-primary-light border-2 border-black p-4 text-black inline-block focus:absolute focus:top-0 focus:left-0 focus:right-0 focus:m-auto focus:w-80 text-center"
      >
        Hoppa till innehåll
      </NextLink>
      {/* <FormProvider {...supportManagementMethods} > */}
      <BaseErrandLayout>
        <div className="grow shrink overflow-y-hidden">
          <div className="container m-auto bg-transparent py-12">
            <div className="mb-xl">
              <Main>
                <Tabs
                  className="border-1 rounded-12 bg-background-content pt-22 pl-5"
                  tabslistClassName="border-0 -m-b-12 flex-wrap ml-10"
                  panelsClassName="border-t-1"
                  size="sm"
                  // current={tabs.filter((tab) => tab.visible).findIndex((tab) => tab.path === pathname)}
                >
                  {VisibleTabs.filter((tab) => tab.visible).map((tab) => {
                    return (
                      <Tabs.Item key={tab.label}>
                        <Tabs.Button className={'text-base'}>
                          <NextLink href={tab.path} className="block w-full h-full">
                            {tab.label}
                          </NextLink>
                        </Tabs.Button>
                        <Tabs.Content>
                          <div className="pt-xl pb-64 px-40">{children}</div>
                        </Tabs.Content>
                      </Tabs.Item>
                    );
                  })}
                </Tabs>
              </Main>
            </div>
          </div>
        </div>
      </BaseErrandLayout>
      {/* </FormProvider> */}
    </>
  );
}
