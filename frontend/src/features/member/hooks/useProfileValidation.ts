import { useFormValidation, type ValidationRule } from './useFormValidation';
import { validateDisplayName } from '../utils/validators';

export interface ProfileFormValues {
    displayName: string;
}

const validationRules: Record<keyof ProfileFormValues, ValidationRule<string>> = {
    displayName: validateDisplayName,
};

export function useProfileValidation() {
    return useFormValidation<ProfileFormValues>(validationRules);
}
