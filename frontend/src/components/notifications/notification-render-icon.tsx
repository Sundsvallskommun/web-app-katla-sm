import { Avatar } from '@astryxdesign/core/Avatar';
import { NotificationDTO } from '@data-contracts/backend/data-contracts';
import { Bell, BellRing, File, type LucideIcon, MessageCircle } from 'lucide-react';

// These descriptions are API values, not translated interface labels.
const eventIcons: Record<string, LucideIcon> = {
  'Meddelande mottaget': MessageCircle,
  'Parkering av ärendet har upphört': BellRing,
  'Ärende uppdaterat': BellRing,
  'En bilaga har lagts till i ärendet.': File,
};

export const NotificationRenderIcon: React.FC<{ notification: NotificationDTO }> = ({ notification }) => {
  if (notification.description === 'Notering skapad') {
    return <Avatar data-cy="avatar-aside" name={notification.createdByFullName} size="sm" />;
  }
  const Icon = eventIcons[notification.description ?? ''] ?? Bell;
  return <Icon aria-hidden="true" className={notification.acknowledged ? 'text-muted' : 'text-accent'} />;
};
