import { Token, type TokenProps } from '@astryxdesign/core/Token';
import { Check, Clock10, Pen, RefreshCw, Scale, Search, SquarePen, UserCheck } from 'lucide-react';
import type { ReactNode } from 'react';
import { useStatusDisplayName } from 'src/hooks/use-status-display-name';

interface StatusAppearance {
  color: TokenProps['color'];
  icon?: ReactNode;
}

const ICON_SIZE = 16;

/**
 * Färg och ikon per status. Namnet kommer från metadatan, men utseendet är vårt: handläggarens
 * flöde går från inskickat till avslutat, och etiketterna ska gå att skilja åt på håll. En status
 * som inte står här visas neutralt — den får sitt namn ur metadatan ändå.
 */
const STATUS_APPEARANCE: Record<string, StatusAppearance> = {
  NEW: { color: 'blue' },
  ASSIGNED: { color: 'pink', icon: <UserCheck size={ICON_SIZE} aria-hidden="true" /> },
  REVIEW: { color: 'green', icon: <Search size={ICON_SIZE} aria-hidden="true" /> },
  INQUIRY: { color: 'purple', icon: <Pen size={ICON_SIZE} aria-hidden="true" /> },
  DECISION: { color: 'orange', icon: <Scale size={ICON_SIZE} aria-hidden="true" /> },
  FOLLOW_UP: { color: 'green', icon: <RefreshCw size={ICON_SIZE} aria-hidden="true" /> },
  AWAITING_RESPONSE: { color: 'orange', icon: <Clock10 size={ICON_SIZE} aria-hidden="true" /> },
  SOLVED: { color: 'default', icon: <Check size={ICON_SIZE} aria-hidden="true" /> },
  DRAFT: { color: 'default', icon: <SquarePen size={ICON_SIZE} aria-hidden="true" /> },
};

const DEFAULT_APPEARANCE: StatusAppearance = { color: 'default' };

export const StatusLabel: React.FC<{ status?: string }> = ({ status }) => {
  const statusDisplayName = useStatusDisplayName();
  const { color, icon } = STATUS_APPEARANCE[status ?? ''] ?? DEFAULT_APPEARANCE;

  return <Token color={color} icon={icon} label={statusDisplayName(status)} data-cy="errand-status" />;
};
