import { Chip } from '@sk-web-gui/react';
import { useFilterStore } from 'src/stores/filter-store';
import { useMetadataStore } from 'src/stores/metadata-store';
import { getAllTypes } from './filter-helpers';

const chipClassName = 'min-w-[calc(50%-1rem)] flex-grow overflow-hidden [&>.sk-icon]:flex-shrink-0';

interface FilterChipsProps {
  queries?: string[];
  categories?: string[];
  startDate?: string;
  endDate?: string;
  onRemoveQuery?: (query: string) => void;
  onRemoveCategory?: (category: string) => void;
  onRemoveDateRange?: () => void;
}

export const FilterChips: React.FC<FilterChipsProps> = (props) => {
  const { metadata } = useMetadataStore();
  const store = useFilterStore();

  const allTypes = getAllTypes(metadata);

  const queries = props.queries ?? store.queries;
  const categories = props.categories ?? store.categories;
  const startDate = props.startDate ?? store.startDate;
  const endDate = props.endDate ?? store.endDate;

  const handleRemoveQuery = (q: string) => {
    if (props.onRemoveQuery) {
      props.onRemoveQuery(q);
    } else {
      store.removeQuery(q);
    }
  };

  const handleRemoveCategory = (cat: string) => {
    if (props.onRemoveCategory) {
      props.onRemoveCategory(cat);
    } else {
      store.setCategories(store.categories.filter((c) => c !== cat));
    }
  };

  const handleRemoveDateRange = () => {
    if (props.onRemoveDateRange) {
      props.onRemoveDateRange();
    } else {
      store.setStartDate('');
      store.setEndDate('');
    }
  };

  return (
    <>
      {queries.map((q) => (
        <Chip className={chipClassName} key={q} onClick={() => handleRemoveQuery(q)}>
          <span className="truncate">Sökord: {q}</span>
        </Chip>
      ))}
      {categories.map((c) => (
        <Chip className={chipClassName} key={c} onClick={() => handleRemoveCategory(c)}>
          <span className="truncate">{allTypes.find((t) => t.name === c)?.displayName ?? c}</span>
        </Chip>
      ))}
      {startDate && endDate && (
        <Chip className={chipClassName} onClick={handleRemoveDateRange}>
          <span className="truncate">
            {startDate} - {endDate}
          </span>
        </Chip>
      )}
    </>
  );
};
