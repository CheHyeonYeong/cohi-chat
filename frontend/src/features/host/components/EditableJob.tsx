interface EditableJobProps {
    job?: string;
    isEditing: boolean;
    editValue: string;
    onEditValueChange: (value: string) => void;
}

export const EditableJob = ({ job, isEditing, editValue, onEditValueChange }: EditableJobProps) => {
    if (!isEditing) {
        if (!job) return null;
        return (
            <p data-testid="host-profile-job" className="mt-1 text-cohi-secondary">
                {job}
            </p>
        );
    }

    return (
        <input
            type="text"
            value={editValue}
            onChange={(e) => onEditValueChange(e.target.value)}
            placeholder="직업 / 소개 (예: 백엔드 개발자)"
            maxLength={100}
            className="mt-2 w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm text-center focus:outline-none focus:ring-2 focus:ring-cohi-primary/30 focus:border-cohi-primary"
            data-testid="host-profile-job-input"
        />
    );
};
