'use client';

import type { TextEditorProps } from '@sk-web-gui/text-editor';
import dynamic from 'next/dynamic';
import { useEffect, useRef } from 'react';

const TextEditor = dynamic(() => import('@sk-web-gui/text-editor'), { ssr: false });

interface RichTextEditorProps extends TextEditorProps {
  id: string;
  labelledBy: string;
  describedBy?: string;
  invalid?: boolean;
  disabled?: boolean;
  required?: boolean;
}

export function RichTextEditor({
  id,
  labelledBy,
  describedBy,
  invalid = false,
  disabled = false,
  required = false,
  readOnly = false,
  ...editorProps
}: RichTextEditorProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const isReadonly = disabled || readOnly;

  useEffect(() => {
    const host = hostRef.current;
    const fieldLabel = document.getElementById(labelledBy);
    if (!host || !(fieldLabel instanceof HTMLLabelElement)) return;

    const focusEditor = (event: MouseEvent) => {
      if (isReadonly) return;
      event.preventDefault();
      host.querySelector<HTMLElement>('.ql-editor')?.focus();
    };

    fieldLabel.addEventListener('click', focusEditor);
    return () => {
      fieldLabel.removeEventListener('click', focusEditor);
    };
  }, [labelledBy, isReadonly]);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    // The editor library creates Quill's editing surface after mounting and does
    // not expose its accessibility attributes through TextEditorProps.
    const syncAccessibilityAttributes = () => {
      const editor = host.querySelector<HTMLElement>('.ql-editor');
      if (!editor) return;

      editor.id = id;
      editor.setAttribute('role', 'textbox');
      editor.setAttribute('aria-multiline', 'true');
      editor.setAttribute('aria-invalid', String(invalid));
      editor.setAttribute('aria-readonly', String(isReadonly));
      editor.setAttribute('aria-disabled', String(disabled));

      if (describedBy) editor.setAttribute('aria-describedby', describedBy);
      else editor.removeAttribute('aria-describedby');

      if (required) editor.setAttribute('aria-required', 'true');
      else editor.removeAttribute('aria-required');

      editor.setAttribute('aria-labelledby', labelledBy);
      editor.removeAttribute('aria-label');
    };

    syncAccessibilityAttributes();
    const observer = new MutationObserver(syncAccessibilityAttributes);
    observer.observe(host, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
    };
  }, [describedBy, disabled, id, invalid, isReadonly, labelledBy, required]);

  return (
    <div ref={hostRef} className="w-full">
      <TextEditor {...editorProps} readOnly={isReadonly} />
    </div>
  );
}
