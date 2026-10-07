'use client';

import { Alert } from '@sk-web-gui/alert';
import { useTranslation } from 'react-i18next';

import { AnnotatedScreenshot } from './annotated-screenshot.component';
import { getUserGuideScreenshot } from './user-guide-manifest';
import { GuideBlock } from './user-guide-steps';
import { UserGuideText } from './user-guide-text.component';
import { getUserGuideUiLabels, UNESCAPED_INTERPOLATION } from './user-guide-ui-labels';

/** Ett stycke i ett steg: brödtext, ett tips eller en skärmbild med pilar. */
export const UserGuideBlock: React.FC<{ block: GuideBlock }> = ({ block }) => {
  const { t } = useTranslation('user-guide');

  switch (block.kind) {
    case 'text':
      return (
        <p className="max-w-[72rem]">
          <UserGuideText textKey={block.textKey} />
        </p>
      );
    case 'tip':
      return (
        <Alert type="info" className="max-w-[72rem]">
          <Alert.Icon />
          <Alert.Content>
            <Alert.Content.Title>{t('tip')}</Alert.Content.Title>
            <Alert.Content.Description>
              <UserGuideText textKey={block.textKey} />
            </Alert.Content.Description>
          </Alert.Content>
        </Alert>
      );
    case 'figure':
      return (
        <AnnotatedScreenshot
          screenshot={getUserGuideScreenshot(block.screenshot)}
          alt={t(block.altKey, { ...getUserGuideUiLabels(t), ...UNESCAPED_INTERPOLATION })}
          callouts={block.callouts.map(({ target, placement, distance, textKey }) => ({
            target,
            placement,
            distance,
            label: <UserGuideText textKey={textKey} />,
          }))}
        />
      );
  }
};
