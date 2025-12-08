'use client';

import { VisibleTabs } from '@components/tabs/tabs';
import BaseErrandLayout from '@layouts/base-errand-layout/base-errand-layout.component';
import Main from '@layouts/main/main.component';
import { Tabs } from '@sk-web-gui/react';
import { ErrandDTO } from '@data-contracts/backend/data-contracts';
import { yupResolver } from '@hookform/resolvers/yup';
import { default as NextLink } from 'next/link';
import { useRef } from 'react';
import { FormProvider, Resolver, useForm } from 'react-hook-form';
import * as yup from 'yup';
import { ErrandButtonGroup } from '@layouts/errand-button-group.component';
import { useTranslation } from 'react-i18next';
import { usePathname } from 'next/navigation';

const FormSchema = yup
  .object({
    classification: yup
      .object({
        category: yup
          .string()
          .notOneOf(['Välj ett alternativ', ''], 'Välj ett alternativ')
          .required('Välj en kategori'),
        type: yup.string().notOneOf(['Välj ett alternativ', ''], 'Välj ett alternativ').required('Välj ett alternativ'),
      })
      .required(),

    // description: yup.string().notRequired(),
    // parameters: yup.array().of(yup.mixed()).notRequired(),
    // channel: yup.string().notRequired(),
  })
  .required();

export default function ErrandLayout({ children }: { children: React.ReactNode }) {
  const { t } = useTranslation();
  const pathName = usePathname()
  const registerNewErrand = !!pathName.includes('/registrera')
  const initialFocus = useRef<HTMLBodyElement>(null);
  const setInitalFocus = () => {
    setTimeout(() => {
      // eslint-disable-next-line @typescript-eslint/no-unused-expressions
      initialFocus.current && initialFocus.current.focus();
    });
  };

  //TODO: Update default values for form
  const defaultErrand: ErrandDTO = {
    title: 'Empty errand',
    priority: 'MEDIUM',
    status: 'NEW',
    channel: 'PHONE',
    resolution: 'INFORMED',
  };

  const methods = useForm<ErrandDTO>({
    resolver: yupResolver(FormSchema) as unknown as Resolver<ErrandDTO>,
    defaultValues: defaultErrand,
    mode: 'onSubmit',
  });

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
      <FormProvider {...methods}>
        <BaseErrandLayout registerNewErrand={registerNewErrand}>
          <div className="grow shrink overflow-y-auto">
            <div className="bg-transparent">
              <div className="mb-xl">
                <div className="mx-auto max-w-[108rem] flex flex-row justify-between pt-32 pb-12">
                  <h1 className="text-h2-lg">{registerNewErrand ? t('filtering:new_errand') : `${t('errand-information:errand')} ${methods.getValues('errandNumber')}`}</h1>
                  <ErrandButtonGroup />
                </div>
                <Main>
                  <Tabs
                    className="border-1 rounded-12 bg-background-content pt-22 pl-5 mx-auto max-w-[108rem]"
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
      </FormProvider>
    </>
  );
}
