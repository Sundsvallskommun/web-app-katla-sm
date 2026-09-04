import { ErrandDTO } from '@data-contracts/backend/data-contracts';
import { EVENT_CONCERNS_INDIVIDUAL } from '@utils/errand-helpers';
import { useFormContext } from 'react-hook-form';

/** Aktuellt val i "Händelsen berör", tom sträng innan användaren valt något. */
export function useEventConcerns(): string {
  const { watch } = useFormContext<ErrandDTO>();
  const parameters = watch('parameters') ?? [];
  return parameters.find((parameter) => parameter.key === 'eventConcerns')?.values?.[0] ?? '';
}

/** Brukarsektionen och wizardens brukarsteg finns bara när händelsen berör en enskild brukare. */
export function useConcernsIndividualUser(): boolean {
  return useEventConcerns() === EVENT_CONCERNS_INDIVIDUAL;
}
