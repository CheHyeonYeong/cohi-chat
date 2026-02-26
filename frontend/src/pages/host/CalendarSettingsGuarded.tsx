import HostGuard from '~/features/host/components/HostGuard';
import CalendarSettings from './CalendarSettings';

export default function CalendarSettingsGuarded() {
    return (
        <HostGuard>
            <CalendarSettings />
        </HostGuard>
    );
}
