import { HostProfileCard } from './HostProfileCard';
import { HostTopicTags } from './HostTopicTags';
import type { HostResponseDTO } from '~/features/member';

interface ProfileSidebarProps {
    host: HostResponseDTO;
    description?: string;
    topics: string[];
}

export const ProfileSidebar = ({ host, description, topics }: ProfileSidebarProps) => (
    <div className="md:w-1/3 md:min-w-[240px] space-y-6">
        <HostProfileCard host={host} />

        {description && (
            <section data-testid="host-profile-description">
                <h2 className="text-lg font-semibold text-cohi-text-dark mb-3">소개</h2>
                <p className="text-gray-700 leading-relaxed">{description}</p>
            </section>
        )}

        <section data-testid="host-profile-topics">
            <h2 className="text-lg font-semibold text-cohi-text-dark mb-3">토픽</h2>
            <HostTopicTags topics={topics} />
        </section>
    </div>
);
