import LucideIcon from '@sk-web-gui/lucide-icon';
import { Button, Checkbox, DatePicker, Input, PopupMenu } from '@sk-web-gui/react';
import dayjs from 'dayjs';
import { useState } from 'react';
import { useFilterStore } from 'src/stores/filter-store';
import { useMetadataStore } from 'src/stores/metadata-store';
import { FilterChips } from './filter-chips.component';
import { getAllTypes } from './filter-helpers';

interface MobileSearchBodyProps {
  onClose: () => void;
}

export const MobileSearchBody: React.FC<MobileSearchBodyProps> = ({ onClose }) => {
  const { metadata } = useMetadataStore();
  const store = useFilterStore();

  // Local state initialized from store
  const [localQueries, setLocalQueries] = useState<string[]>(store.queries);
  const [localCategories, setLocalCategories] = useState<string[]>(store.categories);
  const [localStartDate, setLocalStartDate] = useState(store.startDate);
  const [localEndDate, setLocalEndDate] = useState(store.endDate);

  const [inputValue, setInputValue] = useState('');
  const [dateOpen, setDateOpen] = useState(false);

  const allTypes = getAllTypes(metadata);

  const toggleCategory = (name: string) => {
    if (localCategories.includes(name)) {
      setLocalCategories(localCategories.filter((c) => c !== name));
    } else {
      setLocalCategories([...localCategories, name]);
    }
  };

  const handleApplyDates = () => {
    setDateOpen(false);
  };

  const handleAddQuery = () => {
    const trimmed = inputValue.trim();
    if (trimmed && !localQueries.includes(trimmed)) {
      setLocalQueries([...localQueries, trimmed]);
      setInputValue('');
    }
  };

  const handleApplyFilters = () => {
    store.setQueries(localQueries);
    store.setCategories(localCategories);
    store.setStartDate(localStartDate);
    store.setEndDate(localEndDate);
    onClose();
  };

  return (
    <div className="w-full px-16 pb-[3.2rem]">
      <div className="w-full pt-16 flex flex-col">
        <div className="flex gap-2 w-full">
          <Input.Group className="flex-grow max-w-full">
            <Input.LeftAddin icon>
              <LucideIcon name="search" />
            </Input.LeftAddin>
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAddQuery();
              }}
              placeholder="Skriv för att söka"
            />
          </Input.Group>
        </div>

        <div className="w-full flex flex-col pt-24">
          {/* Ärendetyp */}
          <div className="relative w-full mb-24">
            <PopupMenu>
              <PopupMenu.Button
                rightIcon={<LucideIcon name="chevron-down" />}
                variant="secondary"
                showBackground={false}
                size="md"
                className="w-full flex justify-between items-center text-left"
              >
                Ärendetyp
              </PopupMenu.Button>
              <PopupMenu.Panel className="w-full max-h-[70vh] overflow-y-auto">
                <PopupMenu.Items autoFocus={false}>
                  {allTypes.map((type, idx) => (
                    <PopupMenu.Item key={`type-${idx}`}>
                      <Checkbox
                        labelPosition="left"
                        checked={localCategories.includes(type.name)}
                        onChange={() => toggleCategory(type.name)}
                      >
                        {type.displayName}
                      </Checkbox>
                    </PopupMenu.Item>
                  ))}
                </PopupMenu.Items>
              </PopupMenu.Panel>
            </PopupMenu>
          </div>

          {/* Tidsperiod */}
          <div className="relative w-full mb-24">
            <PopupMenu type="dialog" open={dateOpen} onToggleOpen={setDateOpen}>
              <PopupMenu.Button
                rightIcon={<LucideIcon name="chevron-down" />}
                variant="secondary"
                showBackground={false}
                size="md"
                className="w-full flex justify-between items-center text-left"
              >
                Tidsperiod
              </PopupMenu.Button>
              <PopupMenu.Panel className="w-full">
                <DatePicker
                  value={localStartDate}
                  onChange={(e) => setLocalStartDate(e.target.value)}
                  max={localEndDate ? dayjs(localEndDate).format('YYYY-MM-DD') : undefined}
                />
                <DatePicker
                  value={localEndDate}
                  onChange={(e) => setLocalEndDate(e.target.value)}
                  min={localStartDate ? dayjs(localStartDate).format('YYYY-MM-DD') : undefined}
                />
                <Button onClick={handleApplyDates}>Visa tidsperiod</Button>
              </PopupMenu.Panel>
            </PopupMenu>
          </div>
        </div>

        <div className="py-[0.5rem] pt-[2.4rem]">Valda filter</div>
        <div className="flex flex-wrap gap-8">
          <FilterChips
            queries={localQueries}
            categories={localCategories}
            startDate={localStartDate}
            endDate={localEndDate}
            onRemoveQuery={(q) => setLocalQueries(localQueries.filter((lq) => lq !== q))}
            onRemoveCategory={(c) => setLocalCategories(localCategories.filter((lc) => lc !== c))}
            onRemoveDateRange={() => {
              setLocalStartDate('');
              setLocalEndDate('');
            }}
          />
        </div>
      </div>

      <div className="h-[2.4rem]" />
      <Button className="w-full" size="md" color="primary" onClick={handleApplyFilters}>
        Sök/Filtrera
      </Button>
    </div>
  );
};
