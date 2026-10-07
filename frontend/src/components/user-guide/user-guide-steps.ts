import type { CalloutPlacement } from '@utils/screenshot-callout-geometry';
import type { AppConfig } from 'src/config/appconfig';

import type { UserGuideScreenshotId, UserGuideTargetId } from './user-guide-screenshots';

/**
 * Innehållet i användarguiden "Så rapporterar du en avvikelse", i den ordning det visas.
 *
 * Texterna ligger i locales/<språk>/user-guide.json. Guidens texter hämtar knapparnas och
 * rubrikernas namn från appens egna översättningar (se user-guide-ui-labels.ts), så att guiden
 * säger samma sak som skärmen även när en etikett byter namn.
 *
 * Ändras registreringsflödet ska både bilderna och stegen här uppdateras – se AGENTS.md i
 * repots rot.
 */

type FeatureFlag = keyof AppConfig['features'];

interface GuideCallout<Screenshot extends UserGuideScreenshotId> {
  target: UserGuideTargetId<Screenshot>;
  placement: CalloutPlacement;
  /** Kortare avstånd till siffran där den annars hamnar över text i bilden. */
  distance?: number;
  textKey: string;
}

/** En bild med pilar. Typen låter bara pilarna peka på element som generatorn mäter i just den bilden. */
export type GuideFigureBlock = {
  [Screenshot in UserGuideScreenshotId]: {
    kind: 'figure';
    screenshot: Screenshot;
    altKey: string;
    callouts: GuideCallout<Screenshot>[];
  };
}[UserGuideScreenshotId];

interface GuideTextBlock {
  /** text är brödtext, tip en framhävd ruta med tips eller undantag. */
  kind: 'text' | 'tip';
  textKey: string;
}

export type GuideBlock = (GuideTextBlock | GuideFigureBlock) & {
  /** Blocket visas bara när funktionen är påslagen i den här miljön. */
  feature?: FeatureFlag;
};

export interface GuideStep {
  /** Ankaret i adressen, till exempel /hjalp#om-rapporten. */
  id: string;
  titleKey: string;
  /** En kort etikett vid rubriken, till exempel att steget är valfritt. */
  badgeKey?: string;
  feature?: FeatureFlag;
  blocks: GuideBlock[];
}

/** De numrerade stegen, från översikten till kvittot. */
export const USER_GUIDE_STEPS: GuideStep[] = [
  {
    id: 'starta',
    titleKey: 'steps.start.title',
    blocks: [
      { kind: 'text', textKey: 'steps.start.text' },
      {
        kind: 'figure',
        screenshot: 'overview',
        altKey: 'steps.start.alt',
        callouts: [
          {
            target: 'new-report-button',
            placement: 'right',
            distance: 44,
            textKey: 'steps.start.callouts.new_report',
          },
        ],
      },
    ],
  },
  {
    id: 'rapportor',
    titleKey: 'steps.reporter.title',
    blocks: [
      { kind: 'text', textKey: 'steps.reporter.text' },
      {
        kind: 'figure',
        screenshot: 'reporter',
        altKey: 'steps.reporter.alt',
        callouts: [
          { target: 'reporter-card', placement: 'left', textKey: 'steps.reporter.callouts.reporter_card' },
          { target: 'colleague-checkbox', placement: 'right', textKey: 'steps.reporter.callouts.colleague' },
        ],
      },
    ],
  },
  {
    id: 'om-rapporten',
    titleKey: 'steps.about.title',
    blocks: [
      { kind: 'text', textKey: 'steps.about.text' },
      {
        kind: 'figure',
        screenshot: 'about',
        altKey: 'steps.about.alt',
        callouts: [
          { target: 'event-type', placement: 'right', textKey: 'steps.about.callouts.event_type' },
          { target: 'event-concerns', placement: 'right', textKey: 'steps.about.callouts.event_concerns' },
        ],
      },
      { kind: 'tip', textKey: 'steps.about.tip' },
    ],
  },
  {
    id: 'brukare',
    titleKey: 'steps.user.title',
    badgeKey: 'steps.user.badge',
    blocks: [
      { kind: 'text', textKey: 'steps.user.text' },
      {
        kind: 'figure',
        screenshot: 'user',
        altKey: 'steps.user.alt',
        callouts: [
          { target: 'person-search', placement: 'right', textKey: 'steps.user.callouts.search' },
          { target: 'add-person', placement: 'right', textKey: 'steps.user.callouts.add_person' },
          { target: 'add-manually', placement: 'right', textKey: 'steps.user.callouts.add_manually' },
        ],
      },
    ],
  },
  {
    id: 'ovriga-parter',
    titleKey: 'steps.other_parties.title',
    badgeKey: 'optional',
    feature: 'otherPartiesDisclosure',
    blocks: [
      { kind: 'text', textKey: 'steps.other_parties.text' },
      {
        kind: 'figure',
        screenshot: 'other-parties',
        altKey: 'steps.other_parties.alt',
        callouts: [
          { target: 'search-type', placement: 'right', textKey: 'steps.other_parties.callouts.search_type' },
          { target: 'party-search', placement: 'right', textKey: 'steps.other_parties.callouts.search' },
        ],
      },
    ],
  },
  {
    id: 'beskriv-handelsen',
    titleKey: 'steps.deviation.title',
    blocks: [
      { kind: 'text', textKey: 'steps.deviation.text' },
      {
        kind: 'figure',
        screenshot: 'deviation-place',
        altKey: 'steps.deviation.place_alt',
        callouts: [{ target: 'facility', placement: 'right', textKey: 'steps.deviation.callouts.facility' }],
      },
      {
        kind: 'figure',
        screenshot: 'deviation-time',
        altKey: 'steps.deviation.time_alt',
        callouts: [
          { target: 'event-date', placement: 'left', textKey: 'steps.deviation.callouts.event_date' },
          { target: 'occurred-date', placement: 'left', textKey: 'steps.deviation.callouts.occurred_date' },
        ],
      },
      {
        kind: 'figure',
        screenshot: 'deviation-description',
        altKey: 'steps.deviation.description_alt',
        callouts: [
          { target: 'event-description', placement: 'left', textKey: 'steps.deviation.callouts.event_description' },
          { target: 'actions-taken', placement: 'left', textKey: 'steps.deviation.callouts.actions_taken' },
        ],
      },
    ],
  },
  {
    id: 'skicka',
    titleKey: 'steps.submit.title',
    blocks: [
      { kind: 'text', textKey: 'steps.submit.text' },
      {
        kind: 'figure',
        screenshot: 'submit',
        altKey: 'steps.submit.alt',
        callouts: [
          { target: 'submit-button', placement: 'bottom', textKey: 'steps.submit.callouts.submit' },
          { target: 'cancel-button', placement: 'bottom', textKey: 'steps.submit.callouts.cancel' },
        ],
      },
      { kind: 'tip', textKey: 'steps.submit.draft_tip', feature: 'draftEnabled' },
      { kind: 'text', textKey: 'steps.submit.missing_text' },
      {
        kind: 'figure',
        screenshot: 'error-summary',
        altKey: 'steps.submit.missing_alt',
        callouts: [
          { target: 'summary', placement: 'right', textKey: 'steps.submit.callouts.summary' },
          { target: 'summary-link', placement: 'right', textKey: 'steps.submit.callouts.summary_link' },
        ],
      },
      { kind: 'text', textKey: 'steps.submit.confirm_text' },
      {
        kind: 'figure',
        screenshot: 'confirm',
        altKey: 'steps.submit.confirm_alt',
        callouts: [{ target: 'confirm-button', placement: 'right', textKey: 'steps.submit.callouts.confirm' }],
      },
    ],
  },
  {
    id: 'klart',
    titleKey: 'steps.submitted.title',
    blocks: [
      { kind: 'text', textKey: 'steps.submitted.text' },
      {
        kind: 'figure',
        screenshot: 'submitted',
        altKey: 'steps.submitted.alt',
        callouts: [
          { target: 'receipt', placement: 'right', textKey: 'steps.submitted.callouts.receipt' },
          { target: 'back-to-overview', placement: 'right', textKey: 'steps.submitted.callouts.back' },
        ],
      },
    ],
  },
];

/** Avsnitt efter stegen. De är inga steg i flödet och numreras därför inte. */
export const USER_GUIDE_APPENDIX: GuideStep[] = [
  {
    id: 'mobil',
    titleKey: 'appendix.mobile.title',
    blocks: [
      { kind: 'text', textKey: 'appendix.mobile.text' },
      {
        kind: 'figure',
        screenshot: 'mobile-step',
        altKey: 'appendix.mobile.step_alt',
        callouts: [
          { target: 'step-indicator', placement: 'right', textKey: 'appendix.mobile.callouts.step_indicator' },
          { target: 'next-button', placement: 'top', distance: 56, textKey: 'appendix.mobile.callouts.next' },
        ],
      },
      { kind: 'text', textKey: 'appendix.mobile.summary_text' },
      {
        kind: 'figure',
        screenshot: 'mobile-summary',
        altKey: 'appendix.mobile.summary_alt',
        callouts: [
          { target: 'summary', placement: 'bottom', distance: 56, textKey: 'appendix.mobile.callouts.summary' },
          { target: 'submit-button', placement: 'top', distance: 56, textKey: 'appendix.mobile.callouts.submit' },
        ],
      },
    ],
  },
  {
    id: 'efter-inskickning',
    titleKey: 'appendix.after.title',
    blocks: [{ kind: 'text', textKey: 'appendix.after.text' }],
  },
];

/** Steg och block som hör till en funktion som är avstängd i den här miljön visas inte. */
export const isGuideItemVisible = (item: { feature?: FeatureFlag }, features: Record<FeatureFlag, boolean>): boolean =>
  !item.feature || features[item.feature];
