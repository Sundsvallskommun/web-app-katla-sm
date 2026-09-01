'use client';

import { ErrandFormValidationError } from '@components/json/utils/schema-utils';
import { FormValidationContext } from '@contexts/form-validation-context';
import { focusFirstInvalidField } from '@utils/focus-first-error';
import { ReactNode, useCallback, useEffect, useMemo, useState } from 'react';

// Utbruten till egen fil så att kontextfilen bara exporterar icke-komponenter (react-refresh/only-export-components)
export function FormValidationProvider({ children }: { children: ReactNode }) {
  const [showValidation, setShowValidation] = useState(false);
  const [errors, setErrors] = useState<ErrandFormValidationError[]>([]);
  const [focusRequest, setFocusRequest] = useState(0);

  const focusFirstError = useCallback(() => {
    setFocusRequest((request) => request + 1);
  }, []);

  // Felen renderas i samma uppdatering som valideringen slås på, och avsnitt som fälls ut
  // uppdaterar sig i sin tur. Fokus väntar därför en bildruta så att fältet finns att nå.
  useEffect(() => {
    if (focusRequest === 0) return undefined;

    const frame = requestAnimationFrame(() => {
      focusFirstInvalidField();
    });

    return () => {
      cancelAnimationFrame(frame);
    };
  }, [focusRequest]);

  const value = useMemo(
    () => ({ showValidation, setShowValidation, errors, setErrors, focusFirstError }),
    [showValidation, errors, focusFirstError]
  );

  return <FormValidationContext.Provider value={value}>{children}</FormValidationContext.Provider>;
}
