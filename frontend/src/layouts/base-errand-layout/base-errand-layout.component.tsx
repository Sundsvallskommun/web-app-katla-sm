import { StatusLabel } from '@components/misc/status-label.component';
import { ErrandDTO } from '@data-contracts/backend/data-contracts';
import { PageHeader } from '@layouts/page-header.component';
import { userMenuGroups } from '@layouts/userMenuGroup';
import { useUserStore } from '@services/user-service/user-service';
import LucideIcon from '@sk-web-gui/lucide-icon';
import { Button, Divider, Link, Logo, PopupMenu, UserMenu } from '@sk-web-gui/react';
import { Fragment } from 'react';
import { useFormContext } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useMetadataStore } from 'src/stores/metadata-store';

interface BaseErrandLayoutProps {
  children: React.ReactNode;
  registerNewErrand: boolean;
}

export default function BaseErrandLayout({ children, registerNewErrand }: BaseErrandLayoutProps) {
  const { metadata } = useMetadataStore();
  const user = useUserStore((s) => s.user);
  const { watch } = useFormContext<ErrandDTO>();
  const { t } = useTranslation();

  const errandNumber = watch('errandNumber');
  const category = watch('classification.category');
  const type = watch('classification.type');
  const status = watch('status');

  const SingleErrandTitle = () => (
    <div className="flex items-center gap-24 py-10">
      <a
        href={`${process.env.NEXT_PUBLIC_BASE_PATH}`}
        title={`Katla - ${process.env.NEXT_PUBLIC_APP_NAME}. Gå till startsidan.`}
      >
        <Logo variant="symbol" className="h-40" />
      </a>
      <span className="text-large">
        {registerNewErrand ?
          <strong className="text-large ml-8 font-bold">{t('filtering:new_errand')}</strong>
        : <>
            <StatusLabel status={status} />
            <span className="text-large ml-8 font-bold">
              {metadata?.categories?.find((t) => t.name === category)?.types?.find((t) => t.name === type)
                ?.displayName ?? type}
            </span>
            <span className="ml-8 text-small">{errandNumber}</span>
          </>
        }
      </span>
    </div>
  );

  return (
    <>
      <div className="bg-background-100 h-screen min-h-screen max-h-screen overflow-hidden w-full flex flex-col">
        <div className="relative z-[15] bg-background-content">
          <PageHeader
            logo={<SingleErrandTitle />}
            userMenu={
              <div className="flex items-center h-fit">
                <span data-cy="usermenu">
                  <UserMenu
                    initials={`${user.initials}`}
                    menuTitle={`${user.name} (${user.username})`}
                    menuSubTitle=""
                    menuGroups={userMenuGroups}
                    buttonRounded={false}
                    buttonSize="sm"
                  />
                </span>

                <Divider orientation="vertical" className="mx-24" />
                <Link
                  href={`${process.env.NEXT_PUBLIC_BASE_PATH}/arende/registrera`}
                  target="_blank"
                  data-cy="register-new-errand-button"
                >
                  <Button
                    color={'primary'}
                    variant={'tertiary'}
                    rightIcon={<LucideIcon name="external-link" color="primary" variant="tertiary" />}
                  >
                    {t('filtering:new_errand')}
                  </Button>
                </Link>
              </div>
            }
            mobileMenu={
              <PopupMenu align="end">
                <PopupMenu.Button iconButton>
                  <LucideIcon name="menu" />
                </PopupMenu.Button>
                <PopupMenu.Panel>
                  <PopupMenu.Group>
                    <div className="font-bold">{`${user.name} (${user.username})`}</div>
                  </PopupMenu.Group>
                  <PopupMenu.Items>
                    <PopupMenu.Group>
                      <PopupMenu.Item>
                        <Link href={`${process.env.NEXT_PUBLIC_BASE_PATH}/registrera`}>
                          <LucideIcon name="external-link" className="h-md" color="primary" variant="tertiary" />{' '}
                          {t('filtering:new_errand')}
                        </Link>
                      </PopupMenu.Item>
                    </PopupMenu.Group>

                    {userMenuGroups.map((group, groupindex) => (
                      <PopupMenu.Group key={`mobilegroup-${groupindex}`}>
                        {group.elements.map((item, itemindex) => (
                          <Fragment key={`mobilegroup-${groupindex}-${itemindex}`}>{item.element()}</Fragment>
                        ))}
                      </PopupMenu.Group>
                    ))}
                  </PopupMenu.Items>
                </PopupMenu.Panel>
              </PopupMenu>
            }
          ></PageHeader>
        </div>

        {children}
      </div>
    </>
  );
}
