'use client';

import { createConversation, sendConversationMessage } from '@services/conversation-service/conversation-service';
import {
  Button,
  FileUpload,
  FormControl,
  FormErrorMessage,
  FormLabel,
  UploadFile,
  useSnackbar,
} from '@sk-web-gui/react';
import { sanitizeMessage } from '@utils/sanitize-message';
import dynamic from 'next/dynamic';
import { useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

const TextEditor = dynamic(() => import('@sk-web-gui/text-editor'), { ssr: false });

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
      <FormControl id="message-body" className="w-full" required>
        <FormLabel>{t('messages:compose_label')}</FormLabel>
        <Controller
          control={control}
          name="messagePlainText"
          rules={{
            validate: (value) => value.trim().length > 0 || t('messages:required'),
          }}
          render={() => (
            <TextEditor
              className="h-[20rem]"
              value={editorValue}
              onChange={(event: { target: { value: { markup?: string; plainText?: string } } }) => {
                setValue('messageMarkup', event.target.value.markup ?? '');
                setValue('messagePlainText', event.target.value.plainText ?? '', { shouldValidate: true });
              }}
            />
          )}
        />
        <div className="text-small mt-8 flex justify-between">
          <span className="text-dark-secondary">
            {t('messages:character_limit', { limit: MESSAGE_CHARACTER_LIMIT })}
          </span>
          <span className={isOverLimit ? 'text-error' : 'text-dark-secondary'}>
            {messageLength}/{MESSAGE_CHARACTER_LIMIT}
          </span>
        </div>
        {errors.messagePlainText && <FormErrorMessage>{errors.messagePlainText.message}</FormErrorMessage>}
        {isOverLimit && (
          <FormErrorMessage>{t('messages:too_long', { limit: MESSAGE_CHARACTER_LIMIT })}</FormErrorMessage>
        )}
      </FormControl>

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
    </form>
  );
};
