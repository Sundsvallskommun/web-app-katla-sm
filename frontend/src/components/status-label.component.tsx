import LucideIcon, { LucideIconProps } from '@sk-web-gui/lucide-icon';
import { Label, LabelProps } from '@sk-web-gui/react';


export const StatusLabel: React.FC<{ status?: string; }> = ({
  status
}) => {
  let color: LabelProps['color'],
    inverted: boolean = false,
    icon: React.ComponentProps<LucideIconProps>["name"] | null = null;
  switch (status) {
    case 'SOLVED':
      color = 'primary';
      icon = 'check';
      break;
    case 'ONGOING':
      color = 'gronsta';
      icon = 'pen';
      break;
    case 'NEW':
      color = 'vattjom';
      break;
    case 'PENDING':
      color = 'gronsta';
      inverted = true;
      icon = 'clock-10';
      break;
    case 'AWAITING_INTERNAL_RESPONSE':
      color = 'gronsta';
      inverted = true;
      icon = 'clock-10';
      break;
    case 'SUSPENDED':
      color = 'warning';
      inverted = true;
      icon = 'circle-pause';
      break;
    case 'ASSIGNED':
      color = 'warning';
      inverted = false;
      icon = 'circle-pause';
      break;
    case 'UPSTART':
      color = 'tertiary';
      inverted = true;
      break;
    case 'PUBLISH_SELECTION':
      color = 'vattjom';
      inverted = true;
      break;
    case 'INTERNAL_CONTROL_AND_INTERVIEWS':
      color = 'tertiary';
      inverted = true;
      break;
    case 'REFERENCE_CHECK':
      color = 'juniskar';
      inverted = true;
      break;
    case 'REVIEW':
      color = 'warning';
      inverted = true;
      break;
    case 'SECURITY_CLEARENCE':
      color = 'bjornstigen';
      inverted = true;
      break;
    case 'FEEDBACK_CLOSURE':
      color = 'error';
      inverted = true;
      break;
    default:
      color = 'tertiary';
      break;
  }

  return (
    <Label rounded inverted={inverted} color={color} className={`max-h-full h-auto text-center whitespace-nowrap`}>
      {icon ? <LucideIcon name={icon} size={16} /> : null} {status}
    </Label>
  );
};
