import { useFormValidation, type ValidationRule } from './useFormValidation';

export interface ProfileFormValues {
    displayName: string;
}

const validationRules: Record<keyof ProfileFormValues, ValidationRule<string>> = {
    displayName: (value: string) => {
        const trimmed = value.trim();
        if (!trimmed) return '표시 이름을 입력해주세요.';
        if (trimmed.length < 2 || trimmed.length > 20) {
            return '표시 이름은 2~20자여야 합니다.';
        }
        return null;
    },
};

export function useProfileValidation() {
    return useFormValidation<ProfileFormValues>(validationRules);
}
