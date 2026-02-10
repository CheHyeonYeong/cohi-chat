import { useState, useRef } from 'react';

export interface Step1Data {
    topics: string[];
    description: string;
}

interface RegisterStep1Props {
    data: Step1Data;
    onChange: (data: Step1Data) => void;
    errors: Record<string, string>;
}

export default function RegisterStep1({ data, onChange, errors }: RegisterStep1Props) {
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

    const handleTopicKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            addTopic();
        }
    };

    return (
        <div className="w-full max-w-2xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-bold text-[var(--cohe-text-dark)] mb-2">
                기본 정보 입력
            </h2>
            <p className="text-[var(--cohe-text-dark)]/70 mb-8">
                게스트에게 보여질 미팅 주제와 소개를 작성해주세요.
            </p>

            {/* Topics */}
            <div className="mb-6">
                <label className="block text-sm font-semibold text-[var(--cohe-text-dark)] mb-2">
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
                        className="flex-1 px-4 py-2.5 rounded-lg border border-gray-300 bg-white text-[var(--cohe-text-dark)] placeholder-gray-400 focus:outline-none focus:border-[var(--cohe-primary)] focus:ring-1 focus:ring-[var(--cohe-primary)]"
                    />
                    <button
                        type="button"
                        onClick={addTopic}
                        className="px-4 py-2.5 rounded-lg cohe-btn-outline text-sm font-medium"
                    >
                        추가
                    </button>
                </div>
                {errors.topics && (
                    <p className="mt-1.5 text-sm text-red-500">{errors.topics}</p>
                )}

                {/* Topic tags */}
                {data.topics.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                        {data.topics.map((topic, index) => (
                            <span
                                key={topic}
                                className="inline-flex items-center gap-1 px-3 py-1.5 bg-[var(--cohe-primary)]/10 text-[var(--cohe-primary)] rounded-full text-sm font-medium"
                            >
                                {topic}
                                <button
                                    type="button"
                                    onClick={() => removeTopic(index)}
                                    className="w-4 h-4 flex items-center justify-center rounded-full hover:bg-[var(--cohe-primary)]/20 text-xs leading-none"
                                >
                                    ×
                                </button>
                            </span>
                        ))}
                    </div>
                )}
            </div>

            {/* Description */}
            <div className="mb-6">
                <label className="block text-sm font-semibold text-[var(--cohe-text-dark)] mb-2">
                    소개
                </label>
                <textarea
                    value={data.description}
                    onChange={(e) => onChange({ ...data, description: e.target.value })}
                    placeholder="미팅에 대한 소개를 작성해주세요 (최소 10자)"
                    rows={5}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 bg-white text-[var(--cohe-text-dark)] placeholder-gray-400 focus:outline-none focus:border-[var(--cohe-primary)] focus:ring-1 focus:ring-[var(--cohe-primary)] resize-none"
                />
                <div className="flex justify-between mt-1.5">
                    {errors.description ? (
                        <p className="text-sm text-red-500">{errors.description}</p>
                    ) : (
                        <span />
                    )}
                    <span className={`text-sm ${data.description.length < 10 ? 'text-gray-400' : 'text-[var(--cohe-primary)]'}`}>
                        {data.description.length}자
                    </span>
                </div>
            </div>
        </div>
    );
}
