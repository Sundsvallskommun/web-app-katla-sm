interface TabItem {
  label: string;
  path: string;
  visible: boolean;
}

export const VisibleTabs: TabItem[] = [
  { label: 'Grundinformation', path: `/arende/registrera`, visible: true },
  // { label: 'Meddelanden', path: `/arende/${errandnumber}/meddelanden`, visible: true },
  // { label: 'Bilagor', path: `/arende/${errandnumber}/bilagor`, visible: true },
];
