'use client';

import 'quill/dist/quill.core.css';

import { Button } from '@astryxdesign/core/Button';
import { Collapsible } from '@astryxdesign/core/Collapsible';
import { Dialog, DialogHeader } from '@astryxdesign/core/Dialog';
import { useFocusTrap } from '@astryxdesign/core/hooks';
import { IconButton } from '@astryxdesign/core/IconButton';
import { Spinner } from '@astryxdesign/core/Spinner';
import { Stack } from '@astryxdesign/core/Stack';
import { TextInput } from '@astryxdesign/core/TextInput';
import clsx from 'clsx';
import { Bold, Heading1, Heading2, Italic, Link, List, ListOrdered, Underline } from 'lucide-react';
import type Quill from 'quill';
import type { Range } from 'quill';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import styles from './rich-text-editor.module.css';

export interface RichTextValue {
  markup: string;
  plainText: string;
}

interface RichTextEditorProps {
  id: string;
  labelledBy: string;
  describedBy?: string;
  invalid?: boolean;
  disabled?: boolean;
  required?: boolean;
  readOnly?: boolean;
  name?: string;
  className?: string;
  disableToolbar?: boolean;
  collapsibleToolbar?: boolean;
  value?: Partial<RichTextValue>;
  onChange?: (value: RichTextValue) => void;
  onSelectionChange?: (range: Range | null, oldRange: Range | null) => void;
}

const FORMAT_CONTROLS = [
  { label: 'heading_one', format: 'header', value: 1, icon: Heading1 },
  { label: 'heading_two', format: 'header', value: 2, icon: Heading2 },
  { label: 'bold', format: 'bold', value: true, icon: Bold },
  { label: 'italic', format: 'italic', value: true, icon: Italic },
  { label: 'underline', format: 'underline', value: true, icon: Underline },
  { label: 'bullet_list', format: 'list', value: 'bullet', icon: List },
  { label: 'ordered_list', format: 'list', value: 'ordered', icon: ListOrdered },
] as const;

export function RichTextEditor({
  id,
  labelledBy,
  describedBy,
  invalid = false,
  disabled = false,
  required = false,
  readOnly = false,
  className,
  disableToolbar = false,
  collapsibleToolbar = false,
  value,
  onChange,
  onSelectionChange,
}: RichTextEditorProps) {
  const { t } = useTranslation('editor');
  const hostRef = useRef<HTMLDivElement>(null);
  const callbacks = useRef({ onChange, onSelectionChange });
  const selection = useRef<Range | null>(null);
  const [quill, setQuill] = useState<Quill | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const [formats, setFormats] = useState<Record<string, unknown>>({});
  const [hasSelectedText, setHasSelectedText] = useState(false);
  const [linkOpen, setLinkOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const isReadonly = disabled || readOnly;
  const { containerRef: linkDialogRef } = useFocusTrap<HTMLDialogElement>({ isActive: linkOpen });

  useEffect(() => {
    callbacks.current = { onChange, onSelectionChange };
  }, [onChange, onSelectionChange]);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    let cancelled = false;
    let dispose: (() => void) | undefined;

    // Quill needs the browser DOM. Each mount owns exactly one editor and its
    // listeners, including React's development mount/cleanup/remount cycle.
    void import('quill')
      .then(({ default: QuillEditor }) => {
        if (cancelled) return;
        const container = document.createElement('div');
        host.appendChild(container);
        const editor = new QuillEditor(container, {
          modules: { toolbar: false },
        });
        // Tab leaves the field, including when the caret is inside a list.
        delete editor.keyboard.bindings.Tab;
        const updateFormats = () => {
          setFormats(editor.getFormat(selection.current ?? { index: 0, length: 0 }));
        };
        const textChanged = () => {
          callbacks.current.onChange?.({ markup: editor.getSemanticHTML(), plainText: editor.getText() });
          updateFormats();
        };
        const selectionChanged = (range: Range | null, oldRange: Range | null) => {
          if (range) {
            selection.current = range;
            setHasSelectedText(range.length > 0);
          }
          callbacks.current.onSelectionChange?.(range, oldRange);
          updateFormats();
        };
        editor.on('text-change', textChanged);
        editor.on('selection-change', selectionChanged);
        dispose = () => {
          editor.off('text-change', textChanged);
          editor.off('selection-change', selectionChanged);
          editor.disable();
          container.remove();
        };
        setQuill(editor);
      })
      .catch(() => {
        if (!cancelled) setLoadFailed(true);
      });

    return () => {
      cancelled = true;
      dispose?.();
    };
  }, []);

  useEffect(() => {
    if (!quill) return;
    quill.enable(!isReadonly);
    const editor = quill.root;
    editor.setAttribute('id', id);
    editor.setAttribute('role', 'textbox');
    editor.setAttribute('aria-multiline', 'true');
    editor.setAttribute('aria-invalid', String(invalid));
    editor.setAttribute('aria-readonly', String(isReadonly));
    editor.setAttribute('aria-disabled', String(disabled));
    editor.setAttribute('aria-labelledby', labelledBy);
    if (describedBy) editor.setAttribute('aria-describedby', describedBy);
    else editor.removeAttribute('aria-describedby');
    if (required) editor.setAttribute('aria-required', 'true');
    else editor.removeAttribute('aria-required');
  }, [quill, describedBy, disabled, id, invalid, isReadonly, labelledBy, required]);

  useEffect(() => {
    if (!quill || !value) return;
    if (value.markup !== undefined && value.markup !== quill.getSemanticHTML()) {
      quill.setContents(quill.clipboard.convert({ html: value.markup }), 'silent');
      selection.current = null;
      setHasSelectedText(false);
      setFormats({});
    } else if (value.markup === undefined && value.plainText !== undefined && value.plainText !== quill.getText()) {
      quill.setText(value.plainText, 'silent');
    }
  }, [quill, value]);

  useEffect(() => {
    const fieldLabel = document.getElementById(labelledBy);
    if (!quill || !(fieldLabel instanceof HTMLLabelElement)) return;
    const focusEditor = (event: MouseEvent) => {
      if (disabled) return;
      event.preventDefault();
      quill.root.focus();
    };
    fieldLabel.addEventListener('click', focusEditor);
    return () => {
      fieldLabel.removeEventListener('click', focusEditor);
    };
  }, [quill, labelledBy, disabled]);

  const applyFormat = (format: string, selectedValue: string | number | boolean) => {
    if (!quill || isReadonly) return;
    const range = selection.current ?? { index: 0, length: 0 };
    quill.setSelection(range, 'silent');
    quill.format(format, quill.getFormat(range)[format] === selectedValue ? false : selectedValue, 'user');
    quill.focus();
  };

  const applyLink = (url: string) => {
    if (!quill || isReadonly) return;
    const range = selection.current ?? { index: 0, length: 0 };
    quill.formatText(range, 'link', url.trim() || false, 'user');
    setLinkOpen(false);
  };

  const toolbar = (
    <Stack
      direction="horizontal"
      wrap="wrap"
      gap={1}
      padding={2}
      className="ql-toolbar border-b border-default"
      role="group"
      aria-label={t('formatting')}
    >
      {FORMAT_CONTROLS.map(({ label, format, value: selectedValue, icon: Icon }) => (
        <IconButton
          key={label}
          label={t(label)}
          icon={<Icon size={18} />}
          variant={formats[format] === selectedValue ? 'secondary' : 'ghost'}
          size="lg"
          aria-pressed={formats[format] === selectedValue}
          isDisabled={!quill || isReadonly}
          onClick={() => {
            applyFormat(format, selectedValue);
          }}
        />
      ))}
      <IconButton
        label={t('link')}
        icon={<Link size={18} />}
        variant={formats.link ? 'secondary' : 'ghost'}
        size="lg"
        aria-pressed={!!formats.link}
        isDisabled={!quill || isReadonly || !hasSelectedText}
        onClick={() => {
          setLinkUrl(typeof formats.link === 'string' ? formats.link : '');
          setLinkOpen(true);
        }}
      />
    </Stack>
  );

  return (
    <Stack className={clsx(styles.editor, className)} data-invalid={invalid} data-disabled={disabled}>
      {!disableToolbar &&
        (collapsibleToolbar ?
          <Collapsible trigger={t('formatting')} defaultIsOpen={false}>
            {toolbar}
          </Collapsible>
        : toolbar)}
      <Stack ref={hostRef} className={styles.surface} />
      {!quill && !loadFailed && <Spinner label={t('loading')} />}
      {loadFailed && (
        <p role="alert" className="p-4 text-danger">
          {t('load_error')}
        </p>
      )}
      <Dialog ref={linkDialogRef} isOpen={linkOpen} onOpenChange={setLinkOpen} purpose="form" width={440}>
        <DialogHeader title={t('edit_link')} onOpenChange={setLinkOpen} />
        <Stack gap={4} padding={4}>
          <TextInput
            label={t('link_url')}
            value={linkUrl}
            onChange={setLinkUrl}
            onEnter={() => {
              applyLink(linkUrl);
            }}
            placeholder="https://"
            width="100%"
          />
          <Stack direction="horizontal" wrap="wrap" justify="end" gap={2}>
            {!!formats.link && (
              <Button
                label={t('remove_link')}
                variant="ghost"
                onClick={() => {
                  applyLink('');
                }}
              />
            )}
            <Button
              label={t('cancel')}
              variant="secondary"
              onClick={() => {
                setLinkOpen(false);
              }}
            />
            <Button
              label={t('save_link')}
              onClick={() => {
                applyLink(linkUrl);
              }}
              isDisabled={!linkUrl.trim()}
            />
          </Stack>
        </Stack>
      </Dialog>
    </Stack>
  );
}
