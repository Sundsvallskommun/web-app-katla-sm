import { ErrandFormValidationError } from '@components/json/utils/schema-utils';
import { createContext } from 'react';

export const ErrandSubmissionContext = createContext<
  | {
      validate: () => Promise<ErrandFormValidationError[]>;
      save: (status: 'DRAFT' | 'NEW') => Promise<void>;
      isSaving: boolean;
    }
  | undefined
>(undefined);
