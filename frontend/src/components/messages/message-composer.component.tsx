'use client';
import { Button } from '@astryxdesign/core/Button';
import { FileInput } from '@astryxdesign/core/FileInput';
import { IconButton } from '@astryxdesign/core/IconButton';
import { Stack } from '@astryxdesign/core/Stack';
import { Text } from '@astryxdesign/core/Text';
import { useToast } from '@astryxdesign/core/Toast';
import { FormFieldLabel } from '@components/form-field-label/form-field-label.component';
import { RichTextEditor } from '@components/rich-text-editor/rich-text-editor.component';
import { createConversation, sendConversationMessage } from '@services/conversation-service/conversation-service';
import { sanitizeMessage } from '@utils/sanitize-message';
import { Paperclip, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

const MESSAGE_CHARACTER_LIMIT = 10000;
const MAX_FILE_SIZE_MB = 25;
// Samma bild- och dokumenttyper som meddelandeflödet accepterade tidigare.
const MESSAGE_ATTACHMENT_ACCEPT = [
  'image/jpeg',
  'image/gif',
  'image/png',
  'image/tiff',
  'image/bmp',
  'text/plain',
  'text/html',
  'application/pdf',
  'application/rtf',
  'application/msword',
  'application/octet-stream',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.oasis.opendocument.text',
  'application/vnd.oasis.opendocument.spreadsheet',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
].join(',');

interface MessageFormModel {
  files: File[];
  messageMarkup: string;
  messagePlainText: string;
}

export const MessageComposer: React.FC<{
  errandId: string;
  errandNumber: string;
  onSent: () => void;
}> = ({ errandId, errandNumber, onSent }) => {
  const { t } = useTranslation();
  const toastMessage = useToast();
  const [sendError, setSendError] = useState<string | null>(null);
  const [attachmentInputVersion, setAttachmentInputVersion] = useState(0);

  const {
    control,
    formState: { errors, isSubmitting },
    handleSubmit,
    reset,
    setValue,
    watch,
  } = useForm<MessageFormModel>({
    defaultValues: { files: [], messageMarkup: '', messagePlainText: '' },
    mode: 'onSubmit',
  });

  const files = watch('files');
  const messageMarkup = watch('messageMarkup');
  const messagePlainText = watch('messagePlainText');
  const editorValue = useMemo(() => ({ markup: messageMarkup }), [messageMarkup]);
  const messageLength = messagePlainText.trim().length;
  const isOverLimit = messageLength > MESSAGE_CHARACTER_LIMIT;
  const messageError =
    isOverLimit ? t('messages:too_long', { limit: MESSAGE_CHARACTER_LIMIT }) : errors.messagePlainText?.message;
  const editorDescription = ['message-body-limit', 'message-body-count', messageError && 'message-body-error']
    .filter(Boolean)
    .join(' ');

  const onSubmit = async (data: MessageFormModel) => {
    setSendError(null);
    try {
      const conversation = await createConversation(errandId, t('messages:topic', { errandNumber }));
      if (!conversation.id) throw new Error('Conversation without id');

      await sendConversationMessage(errandId, conversation.id, sanitizeMessage(data.messageMarkup), data.files);

      toastMessage({ body: t('messages:sent'), type: 'info' });
      reset();
      setAttachmentInputVersion((version) => version + 1);
      onSent();
    } catch {
      setSendError(t('messages:send_error'));
    }
  };

  return (
    <Stack
      as="form"
      gap={4}
      data-cy="message-composer"
      onSubmit={(event) => {
        void handleSubmit(onSubmit)(event);
      }}
    >
      <Stack gap={2}>
        <FormFieldLabel id="message-body-label" htmlFor="message-body" required>
          {t('messages:compose_label')}
        </FormFieldLabel>
        <Controller
          control={control}
          name="messagePlainText"
          rules={{
            validate: (value) => {
              const length = value.trim().length;
              if (length === 0) return t('messages:required');
              return length <= MESSAGE_CHARACTER_LIMIT || t('messages:too_long', { limit: MESSAGE_CHARACTER_LIMIT });
            },
          }}
          render={() => (
            <RichTextEditor
              id="message-body"
              labelledBy="message-body-label"
              describedBy={editorDescription}
              required
              readOnly={isSubmitting}
              invalid={!!messageError}
              collapsibleToolbar
              value={editorValue}
              onChange={(value) => {
                setValue('messageMarkup', value.markup);
                setValue('messagePlainText', value.plainText, { shouldValidate: true });
              }}
            />
          )}
        />
        <Stack direction="horizontal" wrap="wrap" justify="between" gap={2}>
          <Text id="message-body-limit" color="secondary" type="supporting">
            {t('messages:character_limit', { limit: MESSAGE_CHARACTER_LIMIT })}
          </Text>
          <Text aria-hidden="true" type="supporting" className={isOverLimit ? 'text-danger' : 'text-muted'}>
            {messageLength}/{MESSAGE_CHARACTER_LIMIT}
          </Text>
          <Text id="message-body-count" className="sr-only">
            {t('messages:character_count', { count: messageLength, limit: MESSAGE_CHARACTER_LIMIT })}
          </Text>
        </Stack>
        {messageError && (
          <p id="message-body-error" className="text-sm text-danger">
            {messageError}
          </p>
        )}
      </Stack>

      {/* Annonsera fel när de ändras, inte räknaren vid varje tangenttryckning. */}
      <Stack
        role="status"
        aria-label={t('messages:validation_status')}
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {messageError}
      </Stack>

      <Stack gap={3}>
        <Controller
          control={control}
          name="files"
          render={({ field }) => (
            <FileInput
              key={attachmentInputVersion}
              label={t('messages:add_attachments')}
              description={t('messages:max_file_size', { size: MAX_FILE_SIZE_MB })}
              placeholder={t('messages:choose_attachments')}
              value={null}
              isMultiple
              isDisabled={isSubmitting}
              accept={MESSAGE_ATTACHMENT_ACCEPT}
              maxSize={MAX_FILE_SIZE_MB * 1024 * 1024}
              width="100%"
              onChange={(selected) => {
                // Each picker selection adds files. A rejected selection must
                // never discard files that the user has already attached.
                if (selected) field.onChange([...field.value, ...(Array.isArray(selected) ? selected : [selected])]);
              }}
            />
          )}
        />
        {files.length > 0 && (
          <ul
            aria-label={t('messages:attached_files')}
            className="divide-y divide-default rounded-lg border border-default"
          >
            {files.map((file, index) => (
              <li key={`${file.name}-${index}`} className="flex items-center gap-3 p-3">
                <Paperclip size={18} aria-hidden="true" className="shrink-0 text-muted" />
                <Text className="min-w-0 flex-1 break-words">{file.name}</Text>
                <Text type="supporting" color="secondary" className="shrink-0">
                  {t('messages:file_size', { size: Math.ceil(file.size / 1024) })}
                </Text>
                <IconButton
                  label={t('messages:remove_attachment', { name: file.name })}
                  icon={<X size={18} />}
                  variant="ghost"
                  isDisabled={isSubmitting}
                  onClick={() => {
                    setValue(
                      'files',
                      files.filter((_, candidate) => candidate !== index)
                    );
                  }}
                />
              </li>
            ))}
          </ul>
        )}
      </Stack>

      {sendError && (
        <p role="alert" className="text-sm text-danger">
          {sendError}
        </p>
      )}

      <Stack direction="horizontal" justify="end">
        <Button
          data-cy="send-message-button"
          type="submit"
          label={t('messages:send')}
          variant="primary"
          size="lg"
          isLoading={isSubmitting}
          isDisabled={isSubmitting || isOverLimit}
        />
      </Stack>
    </Stack>
  );
};
