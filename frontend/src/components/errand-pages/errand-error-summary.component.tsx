'use client';

import { Button } from '@astryxdesign/core/Button';
import { Divider } from '@astryxdesign/core/Divider';
import { useFormValidation } from '@contexts/form-validation-context';
import { focusInvalidField } from '@utils/focus-first-error';
import { ArrowRight } from 'lucide-react';
import { Fragment, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';

/**
 * Allt som hindrar att rapporten skickas in, samlat överst i formuläret. Rapporten är lång, och
 * ett fel i taget i en toast tvingade fram en inskickning per fel — här syns hela återstoden på
 * en gång, och varje rad tar en direkt till sitt fält.
 *
 * Rutan renderas bara när det finns fel, och tar fokus när den dyker upp så att den som skickat
 * in får beskedet oavsett var på sidan knappen trycktes.
 */
export const ErrandErrorSummary: React.FC = () => {
  const { t } = useTranslation();
  const { errors } = useFormValidation();
  const summaryRef = useRef<HTMLDivElement>(null);

  // Knappen som utlöser valideringen sitter längst upp, men rutan kan hamna utanför bild när
  // sidan är skrollad. Fokus flyttas hit så att beskedet både syns och läses upp.
  useEffect(() => {
    if (errors.length === 0) return;
    summaryRef.current?.focus();
    summaryRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [errors]);

  if (errors.length === 0) {
    return null;
  }

  return (
    <div
      ref={summaryRef}
      data-cy="errand-error-summary"
      role="alert"
      tabIndex={-1}
      className="bg-[var(--color-background-red)] border border-danger rounded-lg flex w-full flex-col gap-6 p-6"
    >
      <h2 className="text-lg font-semibold text-foreground">
        {t('errand-information:validation_summary.title', { count: errors.length })}
      </h2>
      <div className="flex flex-col gap-3">
        {errors.map((error, index) => (
          <Fragment key={`${error.fieldId ?? 'form'}-${error.message}`}>
            {index > 0 && <Divider />}
            <div className="flex items-center gap-6">
              <p className="text-foreground min-w-0">{error.message}</p>
              {/* Fel utan fältmål går inte att navigera till – de gäller formuläret som helhet. */}
              {error.fieldId ?
                <Button
                  data-cy="errand-error-summary-link"
                  variant="ghost"
                  size="sm"
                  isIconOnly
                  // Ikonen står för sig själv i designen; en knappyta ritar en ruta runt den.

                  label={t('errand-information:validation_summary.go_to_error', { message: error.message })}
                  icon={<ArrowRight aria-hidden="true" />}
                  onClick={() => {
                    focusInvalidField(error.fieldId ?? '');
                  }}
                />
              : null}
            </div>
          </Fragment>
        ))}
      </div>
    </div>
  );
};
