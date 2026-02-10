import HostGuard from '~/features/host/components/HostGuard';
import TimeSlotSettings from './TimeSlotSettings';

export default function TimeSlotSettingsGuarded() {
    return (
        <HostGuard>
            <TimeSlotSettings />
        </HostGuard>
    );
}
