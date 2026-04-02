interface HostSearchInputProps {
    value: string;
    onChange: (value: string) => void;
}

export const HostSearchInput = ({ value, onChange }: HostSearchInputProps) => (
    <div className="mb-8 space-y-2">
        <label
            htmlFor="host-search-input"
            className="block text-sm font-medium text-cohi-text-dark"
        >
            호스트 검색
        </label>
        <input
            id="host-search-input"
            type="search"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="직무, 주제, 소개로 검색해 보세요"
            autoComplete="off"
            className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-cohi-text-dark shadow-sm outline-none transition focus:border-cohi-primary focus:ring-2 focus:ring-cohi-primary/20"
            data-testid="host-search-input"
        />
        <p className="text-sm text-gray-500">
            예: 취준 백엔, 이직 상담, 포트폴리오 리뷰
        </p>
    </div>
);
