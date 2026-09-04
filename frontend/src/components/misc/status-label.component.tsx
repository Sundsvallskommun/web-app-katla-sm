import { Label, LabelProps } from '@sk-web-gui/react';
import { Check, Clock10, Pen, RefreshCw, Scale, Search, SquarePen, UserCheck } from 'lucide-react';
import { ReactNode } from 'react';
import { useStatusDisplayName } from 'src/hooks/use-status-display-name';

interface StatusAppearance {
  color: LabelProps['color'];
  inverted?: boolean;
  icon?: ReactNode;
}

const ICON_SIZE = 16;

/**
 * Färg och ikon per status. Namnet kommer från metadatan, men utseendet är vårt: handläggarens
 * flöde går från inskickat till avslutat, och etiketterna ska gå att skilja åt på håll. En status
 * som inte står här visas neutralt — den får sitt namn ur metadatan ändå.
 */
const STATUS_APPEARANCE: Record<string, StatusAppearance> = {
  NEW: { color: 'vattjom', inverted: true },
  ASSIGNED: { color: 'juniskar', inverted: true, icon: <UserCheck size={ICON_SIZE} /> },
  REVIEW: { color: 'gronsta', inverted: true, icon: <Search size={ICON_SIZE} /> },
  INQUIRY: { color: 'bjornstigen', inverted: true, icon: <Pen size={ICON_SIZE} /> },
  DECISION: { color: 'warning', inverted: true, icon: <Scale size={ICON_SIZE} /> },
  FOLLOW_UP: { color: 'gronsta', inverted: true, icon: <RefreshCw size={ICON_SIZE} /> },
  AWAITING_RESPONSE: { color: 'warning', icon: <Clock10 size={ICON_SIZE} /> },
  SOLVED: { color: 'primary', icon: <Check size={ICON_SIZE} /> },
  DRAFT: { color: 'tertiary', icon: <SquarePen size={ICON_SIZE} /> },
};

const DEFAULT_APPEARANCE: StatusAppearance = { color: 'tertiary' };

export const StatusLabel: React.FC<{ status?: string }> = ({ status }) => {
  const statusDisplayName = useStatusDisplayName();
  const { color, inverted = false, icon = null } = STATUS_APPEARANCE[status ?? ''] ?? DEFAULT_APPEARANCE;

  return (
    <Label rounded inverted={inverted} color={color} className={`max-h-full h-auto text-center whitespace-nowrap`}>
      {/* Namnet kommer från metadatan, så att en status som läggs till i namespacet visas med
          rätt text utan att appen behöver byggas om. Färg och ikon är fortfarande våra egna. */}
      {icon} {statusDisplayName(status)}
    </Label>
  );
};
