'use client';

import LoaderFullScreen from '@components/loader/loader-fullscreen';
import { VisibleTabs } from '@components/tabs/tabs';
import { FormValidationProvider } from '@contexts/form-validation-context';
import { ErrandDTO } from '@data-contracts/backend/data-contracts';
import { yupResolver } from '@hookform/resolvers/yup';
import BaseErrandLayout from '@layouts/base-errand-layout/base-errand-layout.component';
import { ErrandButtonGroup } from '@layouts/errand-button-group.component';
import Main from '@layouts/main/main.component';
import { getMetadata } from '@services/errand-service/errand-service';
import { Tabs } from '@sk-web-gui/react';
import { default as NextLink } from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { FormProvider, Resolver, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useMetadataStore } from 'src/stores/metadata-store';
import * as yup from 'yup';

// Extended form type with JSON schema form data (not yet in API)
export interface ErrandFormDataItem {
  schemaName: string;
  schemaId?: string;
  data: string; // JSON string
}

export interface ErrandFormDTO extends ErrandDTO {
  errandFormData?: ErrandFormDataItem[];
}

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
  })
  .required();

export default function ErrandLayout({ children }: { children: React.ReactNode }) {
  const { t } = useTranslation();
  const pathName = usePathname();
  const registerNewErrand = !!pathName.includes('/registrera');
  const initialFocus = useRef<HTMLBodyElement>(null);
  const { metadata, setMetadata } = useMetadataStore();
  const [isLoading, setIsLoading] = useState(!metadata?.categories?.length);
  const [metadataError, setMetadataError] = useState<string | null>(null);

  useEffect(() => {
    if (!metadata?.categories?.length) {
      setIsLoading(true);
      setMetadataError(null);
      getMetadata()
        .then((res) => {
          setMetadata(res);
        })
        .catch(() => {
          setMetadataError('Kunde inte ladda metadata. Försök ladda om sidan.');
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [metadata?.categories?.length, setMetadata]);

  const setInitalFocus = () => {
    setTimeout(() => {
      // eslint-disable-next-line @typescript-eslint/no-unused-expressions
      initialFocus.current && initialFocus.current.focus();
    });
  };

  const defaultErrand: ErrandFormDTO = {
    title: 'Empty errand',
    priority: 'MEDIUM',
    status: 'DRAFT',
    channel: 'ESERVICE_KATLA',
    resolution: 'INFORMED',
  };

  const methods = useForm<ErrandFormDTO>({
    resolver: yupResolver(FormSchema) as unknown as Resolver<ErrandFormDTO>,
    defaultValues: defaultErrand,
    mode: 'onSubmit',
  });

  const errandStatus = methods.watch('status');
  const errandNumber = methods.watch('errandNumber');
  const isDraft = errandStatus === 'DRAFT';

  const getHeaderTitle = () => {
    if (registerNewErrand) {
      return t('filtering:new_errand');
    }
    if (isDraft) {
      return `${t('errand-information:draft')} ${errandNumber}`;
    }
    return `${t('errand-information:errand')} ${errandNumber}`;
  };

  if (isLoading) {
    return <LoaderFullScreen />;
  }

  if (metadataError) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <p className="text-error text-lg mb-4">{metadataError}</p>
          <button
            className="px-4 py-2 bg-primary text-white rounded"
            onClick={() => window.location.reload()}
          >
            Ladda om sidan
          </button>
        </div>
      </div>
    );
  }

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
        <FormValidationProvider>
          <BaseErrandLayout registerNewErrand={registerNewErrand}>
            <div className="grow shrink overflow-y-auto">
              <div className="bg-transparent">
                <div className="mb-xl">
                  <div className="mx-auto max-w-[108rem] flex flex-row justify-between pt-32 pb-12">
                    <h1 className="text-h2-lg">{getHeaderTitle()}</h1>
                    <ErrandButtonGroup isNewErrand={registerNewErrand} />
                  </div>
                  <Main>
                    <Tabs
                      className="border-1 rounded-12 bg-background-content pt-22 pl-5 mx-auto max-w-[108rem]"
                      tabslistClassName="border-0 -m-b-12 flex-wrap ml-10"
                      panelsClassName="border-t-1"
                      size="sm"
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
                              <div className={`pt-xl pb-64 px-40 ${!isDraft ? 'pointer-events-none opacity-80' : ''}`}>
                                {children}
                              </div>
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
        </FormValidationProvider>
      </FormProvider>
    </>
  );
}
