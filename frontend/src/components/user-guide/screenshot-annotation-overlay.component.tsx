import { CalloutGeometry } from '@utils/screenshot-callout-geometry';
import { useId } from 'react';

import { CalloutNumber } from './callout-number.component';

/** Samma nyans i båda färglägena, se CalloutNumber. */
const MARK_CLASS = 'stroke-juniskar-surface-primary dark:stroke-juniskar-background-300';
const ARROWHEAD_CLASS = 'fill-juniskar-surface-primary dark:fill-juniskar-background-300';
/** Ljus kant under markeringen, så att den syns även mot sidhuvudets mörka yta. */
const HALO_CLASS = 'stroke-juniskar-text-secondary dark:stroke-juniskar-text-primary';

const MARK_WIDTH = 3;
const HALO_WIDTH = 7;

const percent = (value: number): string => `${value}%`;

interface ScreenshotAnnotationOverlayProps {
  /** En post per pil, i samma ordning som förklaringarna. Null hoppar över pilen men behåller numret. */
  callouts: (CalloutGeometry | null)[];
}

/**
 * Ramar, pilar och siffror ovanpå en skärmbild.
 *
 * SVG:n saknar viewBox med avsikt: koordinaterna anges i procent av bilden, så ramar och pilar
 * följer bilden när den skalas, medan linjebredd, pilspets och siffror behåller sin storlek i
 * skärmpixlar och förblir tydliga även på en liten skärm.
 */
export const ScreenshotAnnotationOverlay: React.FC<ScreenshotAnnotationOverlayProps> = ({ callouts }) => {
  // useId kan innehålla tecken som inte fungerar i en url(#...)-referens.
  const arrowheadId = `arrowhead-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`;

  return (
    <>
      <svg aria-hidden="true" className="pointer-events-none absolute inset-0 h-full w-full">
        <defs>
          <marker
            id={arrowheadId}
            viewBox="0 0 10 10"
            refX="7"
            refY="5"
            markerWidth="4"
            markerHeight="4"
            orient="auto-start-reverse"
          >
            <path d="M 0 0 L 10 5 L 0 10 z" className={ARROWHEAD_CLASS} />
          </marker>
        </defs>
        {callouts.map((callout, index) => {
          if (!callout) return null;
          const { highlight, badge, arrowTip } = callout;
          const rect = {
            x: percent(highlight.x),
            y: percent(highlight.y),
            width: percent(highlight.width),
            height: percent(highlight.height),
            rx: 8,
            fill: 'none',
          };
          const line = {
            x1: percent(badge.x),
            y1: percent(badge.y),
            x2: percent(arrowTip.x),
            y2: percent(arrowTip.y),
            strokeLinecap: 'round' as const,
          };

          return (
            <g key={index}>
              <rect {...rect} className={HALO_CLASS} strokeWidth={HALO_WIDTH} />
              <rect {...rect} className={MARK_CLASS} strokeWidth={MARK_WIDTH} />
              <line {...line} className={HALO_CLASS} strokeWidth={HALO_WIDTH} />
              <line {...line} className={MARK_CLASS} strokeWidth={MARK_WIDTH} markerEnd={`url(#${arrowheadId})`} />
            </g>
          );
        })}
      </svg>
      {callouts.map((callout, index) =>
        callout ?
          <CalloutNumber
            key={index}
            number={index + 1}
            className="absolute -translate-x-1/2 -translate-y-1/2 shadow-md ring-2 ring-background-content"
            style={{ left: percent(callout.badge.x), top: percent(callout.badge.y) }}
          />
        : null
      )}
    </>
  );
};
