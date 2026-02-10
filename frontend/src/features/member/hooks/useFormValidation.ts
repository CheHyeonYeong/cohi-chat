import { useState, useCallback } from 'react';

export type ValidationRule<T> = (value: T) => string | null;

export interface FieldState {
    touched: boolean;
    error: string | null;
    isValid: boolean;
}

export interface UseFormValidationReturn<T extends object> {
    fields: Record<keyof T, FieldState>;
    validateField: (name: keyof T, value: T[keyof T]) => string | null;
    handleBlur: (name: keyof T, value: T[keyof T]) => void;
    validateAll: (values: T) => boolean;
    resetValidation: () => void;
    getInputClassName: (name: keyof T, baseClass?: string) => string;
}

const defaultFieldState: FieldState = {
    touched: false,
    error: null,
    isValid: false,
};

export function useFormValidation<T extends object>(
    rules: Partial<Record<keyof T, ValidationRule<T[keyof T]>>>
): UseFormValidationReturn<T> {
    const [fields, setFields] = useState<Record<keyof T, FieldState>>(() => {
        const initial = {} as Record<keyof T, FieldState>;
        for (const key of Object.keys(rules) as (keyof T)[]) {
            initial[key] = { ...defaultFieldState };
        }
        return initial;
    });

    const validateField = useCallback(
        (name: keyof T, value: T[keyof T]): string | null => {
            const rule = rules[name];
            if (!rule) return null;
            return rule(value);
        },
        [rules]
    );

    const handleBlur = useCallback(
        (name: keyof T, value: T[keyof T]) => {
            const error = validateField(name, value);
            setFields((prev) => ({
                ...prev,
                [name]: {
                    touched: true,
                    error,
                    isValid: error === null,
                },
            }));
        },
        [validateField]
    );

    const validateAll = useCallback(
        (values: T): boolean => {
            const newFields = {} as Record<keyof T, FieldState>;
            let allValid = true;

            for (const key of Object.keys(rules) as (keyof T)[]) {
                const error = validateField(key, values[key]);
                newFields[key] = {
                    touched: true,
                    error,
                    isValid: error === null,
                };
                if (error !== null) {
                    allValid = false;
                }
            }

            setFields(newFields);
            return allValid;
        },
        [rules, validateField]
    );

    const resetValidation = useCallback(() => {
        setFields(() => {
            const reset = {} as Record<keyof T, FieldState>;
            for (const key of Object.keys(rules) as (keyof T)[]) {
                reset[key] = { ...defaultFieldState };
            }
            return reset;
        });
    }, [rules]);

    const getInputClassName = useCallback(
        (name: keyof T, baseClass = ''): string => {
            const field = fields[name];
            if (!field?.touched) {
                return `${baseClass} border-gray-300 focus:border-[var(--cohe-primary)]`;
            }
            if (field.error) {
                return `${baseClass} border-red-500 focus:border-red-500`;
            }
            return `${baseClass} border-green-500 focus:border-green-500`;
        },
        [fields]
    );

    return {
        fields,
        validateField,
        handleBlur,
        validateAll,
        resetValidation,
        getInputClassName,
    };
}
