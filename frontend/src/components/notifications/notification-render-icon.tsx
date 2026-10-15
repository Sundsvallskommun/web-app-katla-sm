import { cx } from '@sk-web-gui/react';
import { Bell, BellRing, ClipboardPen, File, FileText, type LucideIcon, MessageCircle, User } from 'lucide-react';

interface NotificationRenderIconProps {
  /** Vad händelsen gäller, till exempel MESSAGE. Saknas den används standardikonen. */
  subType?: string;
  acknowledged?: boolean;
}

/**
 * Nycklas på subtypen, som är språkneutral, och inte på beskrivningen. Ikonen står sig då när
 * SupportManagement formulerar om en händelse.
 */
const iconConfig: Record<string, { icon: LucideIcon; defaultColor: string }> = {
  MESSAGE: { icon: MessageCircle, defaultColor: 'gronsta' },
  SUSPENSION: { icon: BellRing, defaultColor: 'juniskar' },
  ERRAND: { icon: BellRing, defaultColor: 'juniskar' },
  SYSTEM: { icon: BellRing, defaultColor: 'juniskar' },
  ATTACHMENT: { icon: File, defaultColor: 'vattjom' },
  DECISION: { icon: FileText, defaultColor: 'vattjom' },
  ASSIGNMENT: { icon: User, defaultColor: 'bjornstigen' },
  NOTE: { icon: ClipboardPen, defaultColor: 'juniskar' },
};

const DEFAULT_ICON = { icon: Bell, defaultColor: 'vattjom' };

const surfaceColor: Record<string, string> = {
  juniskar: 'bg-juniskar-surface-accent',
  gronsta: 'bg-gronsta-surface-accent',
  vattjom: 'bg-vattjom-surface-accent',
  bjornstigen: 'bg-bjornstigen-surface-accent',
};

const textColor: Record<string, string> = {
  juniskar: 'text-juniskar-surface-primary',
  gronsta: 'text-gronsta-surface-primary',
  vattjom: 'text-vattjom-surface-primary',
  bjornstigen: 'text-bjornstigen-surface-primary',
  primary: 'text-primary',
};

export const NotificationRenderIcon: React.FC<NotificationRenderIconProps> = ({ subType, acknowledged }) => {
  const config = (subType ? iconConfig[subType] : undefined) ?? DEFAULT_ICON;
  const color = acknowledged ? 'primary' : config.defaultColor;
  const Icon = config.icon;

  return (
    <div
      className={cx(
        `w-[4rem] h-[4rem] rounded-12 flex items-center justify-center`,
        surfaceColor[color] ?? 'bg-tertiary-surface'
      )}
    >
      <Icon aria-hidden="true" size="2.4rem" className={textColor[color] ?? ''} />
    </div>
  );
};
