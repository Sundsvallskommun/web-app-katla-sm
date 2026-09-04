interface TabItem {
  labelKey: string;
  path: string;
  visible: boolean;
}

/**
 * Flikarna hör till ett ärende och länkar till dess egna sidor. Tidigare pekade grundinformationen
 * på registreringssidan, vilket inte märktes så länge det bara fanns en flik att klicka på.
 */
export const getVisibleTabs = (errandNumber: string): TabItem[] => [
  { labelKey: 'common:tabs.basic_information', path: `/arende/${errandNumber}/grundinformation`, visible: true },
  { labelKey: 'common:tabs.messages', path: `/arende/${errandNumber}/meddelanden`, visible: true },
  // { labelKey: 'common:tabs.attachments', path: `/arende/${errandNumber}/bilagor`, visible: true },
];
