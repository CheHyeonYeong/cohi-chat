import type { KeyboardEvent } from 'react';
import { useState, useRef } from 'react';
import { Button } from '~/components/button';
import { Tag } from '~/components/Tag';

export interface MeetingInfoFormData {
    topics: string[];
    description: string;
}

interface MeetingInfoFormProps {
    data: MeetingInfoFormData;
    onChange: (data: MeetingInfoFormData) => void;
    errors: Record<string, string>;
}

export const MeetingInfoForm = ({ data, onChange, errors }: MeetingInfoFormProps) => {
    const [topicInput, setTopicInput] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);

    const addTopic = () => {
        const trimmed = topicInput.trim();
        if (!trimmed) return;
        if (data.topics.includes(trimmed)) {
            setTopicInput('');
            return;
        }
        onChange({ ...data, topics: [...data.topics, trimmed] });
        setTopicInput('');
        inputRef.current?.focus();
    };

    const removeTopic = (index: number) => {
        onChange({ ...data, topics: data.topics.filter((_, i) => i !== index) });
    };

    const handleTopicKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            addTopic();
        }
    };

    return (
        <>
            {/* Topics */}
            <div className="mb-6">
                <label className="block text-sm font-semibold text-cohi-text-dark mb-2">
                    미팅 주제
                </label>
                <div className="flex gap-2">
                    <input
                        ref={inputRef}
                        type="text"
                        value={topicInput}
                        onChange={(e) => setTopicInput(e.target.value)}
                        onKeyDown={handleTopicKeyDown}
                        placeholder="주제를 입력하고 Enter"
                        className="flex-1 px-4 py-2.5 rounded-lg border border-gray-300 bg-white text-cohi-text-dark placeholder-gray-400 focus:outline-none focus:border-cohi-primary focus:ring-1 focus:ring-cohi-primary"
                    />
                    <Button
                        variant="outline"
                        size="md"
                        onClick={addTopic}
                        className="rounded-lg"
                    >
                        추가
                    </Button>
                </div>
                {errors.topics && (
                    <p className="mt-1.5 text-sm text-red-500">{errors.topics}</p>
                )}

                {/* Topic tags */}
                {data.topics.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                        {data.topics.map((topic, index) => (
                            <Tag key={topic} className="gap-1">
                                {topic}
                                <button
                                    type="button"
                                    onClick={() => removeTopic(index)}
                                    className="w-4 h-4 flex items-center justify-center rounded-full hover:bg-cohi-primary/20 text-xs leading-none"
                                >
                                    ×
                                </button>
                            </Tag>
                        ))}
                    </div>
                )}
            </div>

            {/* Description */}
            <div className="mb-6">
                <label className="block text-sm font-semibold text-cohi-text-dark mb-2">
                    소개
                </label>
                <textarea
                    value={data.description}
                    onChange={(e) => onChange({ ...data, description: e.target.value })}
                    placeholder="미팅에 대한 소개를 작성해주세요 (최소 10자)"
                    rows={5}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 bg-white text-cohi-text-dark placeholder-gray-400 focus:outline-none focus:border-cohi-primary focus:ring-1 focus:ring-cohi-primary resize-none"
                />
                <div className="flex justify-between mt-1.5">
                    {errors.description ? (
                        <p className="text-sm text-red-500">{errors.description}</p>
                    ) : (
                        <span />
                    )}
                    <span className={`text-sm ${data.description.length < 10 ? 'text-gray-400' : 'text-cohi-primary'}`}>
                        {data.description.length}자
                    </span>
                </div>
            </div>
        </>
    );
};
