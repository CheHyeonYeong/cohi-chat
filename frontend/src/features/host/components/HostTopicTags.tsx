import { cn } from '~/libs/cn';
import { Tag } from '~/components/Tag';

interface HostTopicTagsProps {
    topics: string[];
    className?: string;
}

export function HostTopicTags({ topics, className }: HostTopicTagsProps) {
    if (topics.length === 0) return null;

    return (
        <div data-testid="host-topic-tags" className={cn('flex flex-wrap gap-2', className)}>
            {topics.map((topic) => (
                <Tag key={topic}>{topic}</Tag>
            ))}
        </div>
    );
}
