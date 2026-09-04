import { ErrandFormDTO } from '@interfaces/errand-form';
import { hasReportContent } from '@utils/errand-helpers';
import { useEffect, useState } from 'react';
import { useFormContext } from 'react-hook-form';

/**
 * Varnar innan sidan lämnas när rapporten bär innehåll som inte skickats in.
 *
 * Webbläsaren äger dialogen helt: texten går inte att styra, och den visas bara för
 * navigeringar som lämnar dokumentet — att stänga fliken, ladda om, eller följa en vanlig
 * länk. Klientnavigering inom appen (next/link, router.push) passerar aldrig beforeunload
 * och behöver en egen dialog, som den CancelErrandDialog avbrytknappen redan använder.
 */
export function useUnsavedReportWarning(): void {
  const { getValues, watch } = useFormContext<ErrandFormDTO>();
  const [hasContent, setHasContent] = useState(() => hasReportContent(getValues()));

  useEffect(() => {
    // Prenumerationen ger en boolean i stället för att rendera om layouten vid varje
    // tangenttryck: samma värde tillbaka och React avstår från omrendering.
    const subscription = watch((values) => {
      setHasContent(hasReportContent(values as ErrandFormDTO));
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [watch]);

  useEffect(() => {
    if (!hasContent) return;

    // preventDefault är hela API:et: texten i dialogen ägs av webbläsaren sedan 2016 och går
    // inte att styra. Det äldre event.returnValue är utfasat och avvisas av lintreglerna.
    const warnBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
    };

    window.addEventListener('beforeunload', warnBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', warnBeforeUnload);
    };
  }, [hasContent]);
}
