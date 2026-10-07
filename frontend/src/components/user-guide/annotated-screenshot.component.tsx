import { cx } from '@sk-web-gui/react';
import { withBasePath } from '@utils/base-path';
import { CalloutPlacement, getCalloutGeometry } from '@utils/screenshot-callout-geometry';
import Image from 'next/image';
import { ReactNode } from 'react';

import { CalloutNumber } from './callout-number.component';
import { ScreenshotAnnotationOverlay } from './screenshot-annotation-overlay.component';
import { ScreenshotRect, USER_GUIDE_IMAGE_DIRECTORY, UserGuideScreenshot } from './user-guide-screenshots';

export interface ScreenshotCallout {
  /** Elementet pilen pekar på, så som generatorn döpt det i manifestet. */
  target: string;
  placement: CalloutPlacement;
  /** Avståndet från elementet till siffran, i bildens pixlar. Se BADGE_DISTANCE. */
  distance?: number;
  label: ReactNode;
}

interface AnnotatedScreenshotProps {
  /** Saknas när bilden ännu inte genererats. Förklaringarna visas då utan bild. */
  screenshot?: UserGuideScreenshot;
  alt: string;
  callouts: ScreenshotCallout[];
}

/**
 * En skärmbild med numrerade pilar, och förklaringarna som en numrerad lista under bilden.
 *
 * Listan bär hela instruktionen i text. Bilden visar var, men den som inte ser bilden – eller
 * inte hittar pilen – ska kunna följa guiden ändå.
 */
export const AnnotatedScreenshot: React.FC<AnnotatedScreenshotProps> = ({ screenshot, alt, callouts }) => {
  // Ett element som saknas i manifestet ger ingen pil, men förklaringen och numreringen står kvar.
  // Enhetstestet för manifestet fångar glappet innan det når en användare.
  const geometries = callouts.map(({ target, placement, distance }) => {
    const rect: ScreenshotRect | undefined = screenshot?.targets[target];
    return screenshot && rect ? getCalloutGeometry(rect, screenshot, placement, distance) : null;
  });

  // Mobilbilder är stående. I full bredd hade en sådan bild blivit flera skärmhöjder hög, så den
  // hålls smal och får förklaringarna bredvid sig när det finns plats.
  const isPortrait = screenshot ? screenshot.height > screenshot.width : false;

  return (
    <figure className={cx('flex flex-col gap-16', isPortrait && 'md:flex-row md:items-start md:gap-40')}>
      {screenshot && (
        // Ingen overflow-hidden: en siffra nära bildens kant får sticka ut hellre än att klippas.
        <div className={cx('relative', isPortrait && 'w-full max-w-[32rem] shrink-0')}>
          <Image
            src={withBasePath(`/${USER_GUIDE_IMAGE_DIRECTORY}/${screenshot.file}`)}
            alt={alt}
            width={screenshot.width}
            height={screenshot.height}
            sizes={isPortrait ? '32rem' : '(min-width: 1280px) 88rem, 100vw'}
            className="border-divider rounded-utility block h-auto w-full border-1"
          />
          <ScreenshotAnnotationOverlay callouts={geometries} />
        </div>
      )}
      {callouts.length > 0 && (
        <figcaption>
          <ol className="flex flex-col gap-12">
            {callouts.map((callout, index) => (
              <li key={callout.target} className="flex items-start gap-12">
                <CalloutNumber number={index + 1} />
                <span className="pt-2">{callout.label}</span>
              </li>
            ))}
          </ol>
        </figcaption>
      )}
    </figure>
  );
};
