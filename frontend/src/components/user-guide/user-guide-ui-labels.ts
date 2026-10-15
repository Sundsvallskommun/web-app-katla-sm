import type { TFunction } from 'i18next';
import { appConfig } from 'src/config/appconfig';

/**
 * Namnen på de knappar, rubriker och val som guiden hänvisar till, hämtade ur appens egna
 * översättningar. Guidens texter sätter in dem som {{nyckel}}, så att guiden alltid använder
 * samma ord som skärmen. Byter en knapp namn följer guiden med utan att någon behöver minnas
 * att ändra den.
 *
 * Etiketter som kommer från avvikelseschemat (till exempel "Enhet eller avdelning") finns inte
 * i appens översättningar och står därför direkt i guidens texter.
 */
export const getUserGuideUiLabels = (t: TFunction) => ({
  app: appConfig.applicationName,
  help: t('user-guide:help_link.text'),
  newReport: t('filtering:new_errand_mobile'),
  reportShortcut: t('filtering:new_errand'),
  reporter: t('errand-information:reporter.title'),
  reportingForColleague: t('errand-information:stakeholder.reporting_for_colleague'),
  about: t('errand-information:about.title'),
  eventType: t('errand-information:about.event_type_label'),
  deviation: t('errand-information:about.event_type_deviation'),
  misconduct: t('errand-information:about.event_type_misconduct'),
  misconductInfo: t('errand-information:about.misconduct_alert_description'),
  eventConcerns: t('errand-information:about.event_concerns_label'),
  individual: t('errand-information:about.event_concerns_individual'),
  group: t('errand-information:about.event_concerns_group'),
  userSection: t('errand-information:user.title'),
  search: t('filtering:search'),
  addPerson: t('errand-information:stakeholder.add_person'),
  addManually: t('errand-information:stakeholder.add_manually'),
  otherParties: t('errand-information:other_parties.title'),
  person: t('errand-information:stakeholder.person'),
  employee: t('errand-information:stakeholder.employee'),
  register: t('errand-information:register'),
  cancel: t('errand-information:cancel'),
  saveDraft: t('errand-information:save_draft'),
  drafts: t('filtering:errands.draft'),
  confirmTitle: t('errand-information:submit_confirm.title'),
  confirmSubmit: t('errand-information:submit_confirm.submit'),
  submittedTitle: t('errand-information:submitted.title'),
  backToOverview: t('errand-information:submitted.back_to_overview'),
  submittedList: t('filtering:errands.open'),
  closedList: t('filtering:errands.closed'),
  next: t('errand-information:wizard.next'),
  edit: t('errand-information:wizard.edit'),
  summary: t('errand-information:wizard.summary'),
  submitShort: t('errand-information:wizard.submit'),
  messages: t('common:tabs.messages'),
});

/**
 * Etiketterna sätts in som de är. React skyddar redan texten, och med i18nexts egen escaping
 * skulle till exempel "Grupp och/eller verksamhet" visas med en HTML-entitet mitt i ordet.
 */
export const UNESCAPED_INTERPOLATION = { interpolation: { escapeValue: false } };

export type UserGuideUiLabels = ReturnType<typeof getUserGuideUiLabels>;
