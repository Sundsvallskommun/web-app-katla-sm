import { PageHeader } from "@layouts/page-header.component";
import { userMenuGroups } from "@layouts/userMenuGroup";
import LucideIcon from "@sk-web-gui/lucide-icon";
import { Button, Divider, Link, Logo, PopupMenu, UserMenu } from "@sk-web-gui/react";
import { usePathname } from "next/navigation";
import { Fragment } from "react";

interface BaseErrandLayoutProps {
  children: React.ReactNode;
}

export default function BaseErrandLayout({ children }: BaseErrandLayoutProps) {

//   const applicationEnvironment = getApplicationEnvironment();
//   const { isMinLargeDevice } = useThemeQueries();
  const pathName = usePathname();

  pathName.includes('registrera');


  const SingleErrandTitle = () => (
    <div className="flex items-center gap-24 py-10">
      <a
        href={`${process.env.NEXT_PUBLIC_BASEPATH}`}
        title={`Draken - ${
          process.env.NEXT_PUBLIC_APP_NAME
        }. Gå till startsidan.`}
      >
        <Logo
          variant="symbol"
          className="h-40"
        />
      </a>
      <span className="text-large">
{ pathName.includes('registrera') && (
    <>
            {/* <StatusLabel status={supportErrand.status} />
            <span className="font-bold ml-8">
              {supportMetadata?.categories
                ?.find((t) => t.name === supportErrand.category)
                ?.types.find((t) => t.name === supportErrand.classification.type)?.displayName ||
                supportErrand.type}{' '}
            </span>
            <span className="text-small">({errandNumber})</span> */}
            </>
   )}
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
                    // initials={`${user.firstName[0]}${user.lastName[0]}`}
                    // menuTitle={`${user.name} (${user.username})`}
                    menuSubTitle=""
                    menuGroups={userMenuGroups}
                    buttonRounded={false}
                    buttonSize="sm"
                  />
                </span>

                <Divider orientation="vertical" className="mx-24" />
                <Link
                  href={`${process.env.NEXT_PUBLIC_BASEPATH}/arende/registrera`}
                  target="_blank"
                  data-cy="register-new-errand-button"
                >
                  <Button
                    color={'primary'}
                    variant={'tertiary'}
                    rightIcon={<LucideIcon name="external-link" color="primary" variant="tertiary" />}
                  >
                    Nytt ärende
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
                    {/* <div className="font-bold">{`${user.name} (${user.username})`}</div> */}
                  </PopupMenu.Group>
                  <PopupMenu.Items>
                    <PopupMenu.Group>
                        <PopupMenu.Item>
                          <Link href={`${process.env.NEXT_PUBLIC_BASEPATH}/registrera`}>
                            <LucideIcon name="external-link" className="h-md" color="primary" variant="tertiary" /> Nytt
                            ärende
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
          >
          </PageHeader>
        </div>

        {children}
      </div>
    </>
  );
}
