import { Badge, type BadgeVariant } from '@astryxdesign/core/Badge';
import { Check, Clock10, Pen, RefreshCw, Scale, Search, SquarePen, UserCheck } from 'lucide-react';
import type { ReactNode } from 'react';
import { useStatusDisplayName } from 'src/hooks/use-status-display-name';

interface StatusAppearance {
  variant: BadgeVariant;
  icon?: ReactNode;
}

const ICON_SIZE = 16;

/**
 * Färg och ikon per status. Namnet kommer från metadatan, men utseendet är vårt: handläggarens
 * flöde går från inskickat till avslutat, och etiketterna ska gå att skilja åt på håll. En status
 * som inte står här visas neutralt — den får sitt namn ur metadatan ändå.
 */
const STATUS_APPEARANCE: Record<string, StatusAppearance> = {
  NEW: { variant: 'blue' },
  ASSIGNED: { variant: 'pink', icon: <UserCheck size={ICON_SIZE} aria-hidden="true" /> },
  REVIEW: { variant: 'green', icon: <Search size={ICON_SIZE} aria-hidden="true" /> },
  INQUIRY: { variant: 'purple', icon: <Pen size={ICON_SIZE} aria-hidden="true" /> },
  DECISION: { variant: 'orange', icon: <Scale size={ICON_SIZE} aria-hidden="true" /> },
  FOLLOW_UP: { variant: 'green', icon: <RefreshCw size={ICON_SIZE} aria-hidden="true" /> },
  AWAITING_RESPONSE: { variant: 'warning', icon: <Clock10 size={ICON_SIZE} aria-hidden="true" /> },
  SOLVED: { variant: 'neutral', icon: <Check size={ICON_SIZE} aria-hidden="true" /> },
  DRAFT: { variant: 'neutral', icon: <SquarePen size={ICON_SIZE} aria-hidden="true" /> },
};

const DEFAULT_APPEARANCE: StatusAppearance = { variant: 'neutral' };

export const StatusLabel: React.FC<{ status?: string }> = ({ status }) => {
  const statusDisplayName = useStatusDisplayName();
  const { variant, icon } = STATUS_APPEARANCE[status ?? ''] ?? DEFAULT_APPEARANCE;

  return <Badge variant={variant} icon={icon} label={statusDisplayName(status)} data-cy="errand-status" />;
};
