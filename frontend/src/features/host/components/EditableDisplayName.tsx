interface EditableDisplayNameProps {
    displayName: string;
    isEditing: boolean;
    editValue: string;
    onEditValueChange: (value: string) => void;
}

export const EditableDisplayName = ({ displayName, isEditing, editValue, onEditValueChange }: EditableDisplayNameProps) => {
    if (!isEditing) {
        return (
            <h1
                data-testid="host-profile-name"
                className="mt-4 text-2xl font-bold text-cohi-text-dark"
            >
                {displayName}
            </h1>
        );
    }

    return (
        <input
            type="text"
            value={editValue}
            onChange={(e) => onEditValueChange(e.target.value)}
            placeholder="닉네임 (2-20자)"
            maxLength={20}
            minLength={2}
            className="mt-4 w-full px-3 py-1.5 border border-gray-300 rounded-lg text-lg font-bold text-center focus:outline-none focus:ring-2 focus:ring-cohi-primary/30 focus:border-cohi-primary"
            data-testid="host-profile-name-input"
        />
    );
};
