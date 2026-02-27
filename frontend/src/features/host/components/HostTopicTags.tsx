import { cn } from '~/libs/cn';

interface HostTopicTagsProps {
    topics: string[];
    className?: string;
}

export default function HostTopicTags({ topics, className }: HostTopicTagsProps) {
    if (topics.length === 0) return null;

    return (
        <div data-testid="host-topic-tags" className={cn('flex flex-wrap gap-2', className)}>
            {topics.map((topic) => (
                <span
                    key={topic}
                    className="px-3 py-1.5 bg-[var(--cohe-primary)]/10 text-[var(--cohe-primary)] rounded-full text-sm font-medium"
                >
                    {topic}
                </span>
            ))}
        </div>
    );
}
