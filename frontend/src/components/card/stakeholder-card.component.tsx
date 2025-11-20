import LucideIcon from "@sk-web-gui/lucide-icon";
import { Button } from "@sk-web-gui/react";

export const StakeholderCard: React.FC<{
  //   person: CasedataOwnerOrContact;
  //   availableRoles: Role[];
  isEditable?: boolean;
  onRemove?: () => void;
  //   onUpdate?: (values: CasedataOwnerOrContact) => void;
}> = ({ isEditable, onRemove }) => {
  //   const [isOpen, setIsOpen] = useState(false);
  //   const { isMaxMediumDevice } = useThemeQueries();
  //   const { errand } = useContext(AppContext);

  return (
    <div className="border-1 rounded-12 bg-background-content w-full max-w-[52.5rem] my-15">
      <div className="rounded-t-12 bg-vattjom-background-200 h-[4rem] flex items-center mb-[1.5rem]">
        <strong className="px-[1rem]">Role</strong>
      </div>
      <div className="px-[1rem]">
        <p className="text-[1.6rem] font-semibold">person.firstName person.lastName person.adAccount</p>
        <div className="flex text-md mb-10 flex-row">
            <div className="flex flex-col mr-10">
              <div>
                person.personalNumber
</div>
              <div className="italic text-text-secondary">
                person.street person.city
              </div>
            </div>
       
          <div className="flex flex-col">
            <div className="">
              person.newEmail
            </div>
            <div >
              person.newPhoneNumber
            </div>
          </div>
        </div>

        {isEditable  && (
          <div className="flex flex-col sm:flex-row gap-[1rem] mb-10">
            <Button
              data-cy="edit-card-button"
              leftIcon={<LucideIcon name="pen" size={16} />}
              variant="tertiary"
              size="sm"
            >
              Redigera uppgifter
            </Button>
            <Button
              data-cy="remove-card-button"
              leftIcon={<LucideIcon name="x" size={16} />}
              variant="tertiary"
              size="sm"
              onClick={onRemove}
            >
              Ta bort
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
