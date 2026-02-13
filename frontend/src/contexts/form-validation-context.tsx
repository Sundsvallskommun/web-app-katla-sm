'use client';
/* eslint-disable react-refresh/only-export-components */

import { createContext, useContext, useState, ReactNode } from 'react';

interface FormValidationContextType {
  showValidation: boolean;
  setShowValidation: (show: boolean) => void;
}

const FormValidationContext = createContext<FormValidationContextType | undefined>(undefined);

export function FormValidationProvider({ children }: { children: ReactNode }) {
  const [showValidation, setShowValidation] = useState(false);
  return (
    <FormValidationContext.Provider value={{ showValidation, setShowValidation }}>
      {children}
    </FormValidationContext.Provider>
  );
}

export function useFormValidation() {
  const context = useContext(FormValidationContext);
  if (!context) {
    throw new Error('useFormValidation must be used within FormValidationProvider');
  }
  return context;
}
