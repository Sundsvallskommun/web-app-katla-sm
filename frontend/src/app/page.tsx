import { redirect } from 'next/navigation';
import { appConfig } from 'src/config/appconfig';

export default function RootIndex() {
  redirect(appConfig.mode === 'catalogue' ? '/katlor' : '/oversikt');
}
