'use client';

import { cx } from '@sk-web-gui/react';
import { ReactNode, RefObject, useLayoutEffect, useRef } from 'react';

interface ModalLayerProps {
  id: string;
  label: string;
  show: boolean;
  onClose: () => void;
  initialFocus: RefObject<HTMLElement | null>;
  variant?: 'panel' | 'dialog';
  className?: string;
  'data-cy'?: string;
  children: ReactNode;
}

/**
 * Livscykelägare för appens modala paneler och dialoger. Webbläsarens showModal äger
 * topplager, inert bakgrund, tangentbordsfokus och återgång till utlösaren.
 * Anroparen anger initialt fokus; webbläsaren äger därefter fokusordningen.
 *
 * @sk-web-gui/modal 2.3.5 / HeadlessUI 2.2.10 lämnade bakgrunden fokuserbar
 * vid dynamisk montering. Återanvänd deras Modal när samma browserkontrakt
 * passerar utan extra monterings-/öppningsfaser; inför ingen parallell fokusfälla här.
 */
export const ModalLayer: React.FC<ModalLayerProps> = ({
  id,
  label,
  show,
  onClose,
  initialFocus,
  variant = 'panel',
  className,
  'data-cy': testId,
  children,
}) => {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useLayoutEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog || !show) return;

    dialog.showModal();
    initialFocus.current?.focus();
    // Layout-cleanup kör före borttagning ur DOM även när föräldern avmonterar
    // panelen. close() kan då återställa fokus till den kvarvarande utlösaren.
    return () => {
      if (dialog.open) dialog.close();
    };
  }, [show, initialFocus]);

  return (
    <dialog
      ref={dialogRef}
      id={id}
      data-cy={testId}
      aria-label={label}
      aria-modal="true"
      className={cx(
        'fixed flex flex-col border-0 text-left text-dark-secondary backdrop:bg-primitives-overlay-darken-6 dark:backdrop:bg-primitives-overlay-darken-8 [&:not([open])]:hidden',
        variant === 'panel' ?
          'm-0 max-h-none max-w-none p-0 bg-background-content'
        : 'sk-modal-dialog sk-dialog inset-0 m-auto min-w-0 md:min-w-[min(25em,calc(100vw-3.2rem))] max-h-[calc(100dvh-3.2rem)] max-w-[calc(100vw-3.2rem)] overflow-y-auto',
        className
      )}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClose={(event) => {
        // Ignorera close-event från egen cleanup och ett äldre öppningstillfälle.
        if (show && !event.currentTarget.open) onClose();
      }}
    >
      {children}
    </dialog>
  );
};
