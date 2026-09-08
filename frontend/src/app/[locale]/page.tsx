import { redirect } from 'next/navigation';
import { appConfig } from 'src/config/appconfig';

export default function Index() {
  redirect(appConfig.mode === 'catalogue' ? '/katlor' : '/oversikt');
}
