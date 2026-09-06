'use client';
import { FormFieldLabel } from '@components/form-field-label/form-field-label.component';
import { RichTextEditor } from '@components/rich-text-editor/rich-text-editor.component';
import { createConversation, sendConversationMessage } from '@services/conversation-service/conversation-service';
import { Button, FileUpload, FormControl, FormErrorMessage, UploadFile, useSnackbar } from '@sk-web-gui/react';
import { sanitizeMessage } from '@utils/sanitize-message';
import { useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

const MESSAGE_CHARACTER_LIMIT = 10000;
const MAX_FILE_SIZE_MB = 25;

interface MessageFormModel {
  files: UploadFile[];
  messageMarkup: string;
  messagePlainText: string;
}

export const MessageComposer: React.FC<{
  errandId: string;
  errandNumber: string;
  onSent: () => void;
}> = ({ errandId, errandNumber, onSent }) => {
  const { t } = useTranslation();
  const toastMessage = useSnackbar();
  const [sendError, setSendError] = useState<string | null>(null);

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

      toastMessage({ position: 'bottom', closeable: false, message: t('messages:sent'), status: 'success' });
      reset();
      onSent();
    } catch {
      setSendError(t('messages:send_error'));
    }
  };

  return (
    <form
      className="flex flex-col gap-24"
      data-cy="message-composer"
      onSubmit={(event) => {
        void handleSubmit(onSubmit)(event);
      }}
    >
      <fieldset disabled={isSubmitting} aria-busy={isSubmitting} className="contents">
        <FormControl id="message-body" className="w-full" required invalid={!!messageError}>
          <FormFieldLabel>{t('messages:compose_label')}</FormFieldLabel>
          <Controller
            control={control}
            name="messagePlainText"
            rules={{
              validate: (value) => value.trim().length > 0 || t('messages:required'),
            }}
            render={() => (
              <RichTextEditor
                id="message-body"
                labelledBy="message-body-label"
                describedBy={editorDescription}
                required
                readOnly={isSubmitting}
                disableToolbar={isSubmitting}
                invalid={!!messageError}
                className="[&_.ql-container]:h-[20rem] [&_.ql-toolbar.ql-snow]:h-auto [&_.ql-toolbar]:min-h-[4rem] [&_.ql-toolbar]:flex-wrap"
                value={editorValue}
                onChange={(event) => {
                  setValue('messageMarkup', event.target.value.markup ?? '');
                  setValue('messagePlainText', event.target.value.plainText ?? '', { shouldValidate: true });
                }}
              />
            )}
          />
          <div className="text-small flex flex-wrap justify-between gap-x-16 gap-y-4">
            <span id="message-body-limit" className="text-dark-secondary">
              {t('messages:character_limit', { limit: MESSAGE_CHARACTER_LIMIT })}
            </span>
            <span aria-hidden="true" className={isOverLimit ? 'text-error' : 'text-dark-secondary'}>
              {messageLength}/{MESSAGE_CHARACTER_LIMIT}
            </span>
            <span id="message-body-count" className="sr-only">
              {t('messages:character_count', { count: messageLength, limit: MESSAGE_CHARACTER_LIMIT })}
            </span>
          </div>
          {messageError && <FormErrorMessage id="message-body-error">{messageError}</FormErrorMessage>}
        </FormControl>

        {/* Annonsera fel när de ändras, inte räknaren vid varje tangenttryckning. */}
        <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
          {messageError}
        </div>

        <div className="flex flex-col gap-8">
          <Controller
            control={control}
            name="files"
            render={({ field }) => (
              <FileUpload.Button appendFiles={field.value} maxFileSizeMB={MAX_FILE_SIZE_MB} {...field} />
            )}
          />
          <span className="text-small text-dark-secondary">
            {t('messages:max_file_size', { size: MAX_FILE_SIZE_MB })}
          </span>
        </div>

        {files.length > 0 && (
          <FileUpload.List showBorder>
            {files.map((file, index) => (
              <FileUpload.ListItem
                key={`${file.meta.name}-${index}`}
                index={index}
                file={file}
                actionsProps={{
                  showRemove: true,
                  onRemove: () => {
                    setValue(
                      'files',
                      files.filter((candidate) => candidate !== file)
                    );
                  },
                }}
              />
            ))}
          </FileUpload.List>
        )}

        {sendError && <FormErrorMessage>{sendError}</FormErrorMessage>}

        <div>
          <Button
            data-cy="send-message-button"
            type="submit"
            color="vattjom"
            loading={isSubmitting}
            disabled={isSubmitting || isOverLimit}
          >
            {t('messages:send')}
          </Button>
        </div>
      </fieldset>
    </form>
  );
};
