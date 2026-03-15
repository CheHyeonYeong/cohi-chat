import { forwardRef, useMemo } from 'react';
import * as SelectPrimitive from '@radix-ui/react-select';
import { ChevronDownIcon, CheckIcon } from '~/components/icons';
import { cn } from '~/libs/cn';

interface SelectOption {
    value: string;
    label: string;
}

interface SelectProps {
    value?: string;
    defaultValue?: string;
    onValueChange?: (value: string) => void;
    options: SelectOption[];
    placeholder?: string;
    className?: string;
    disabled?: boolean;
    'data-testid'?: string;
}

const triggerStyles = cn(
    'flex items-center justify-between w-full px-4 py-3 rounded-lg border border-gray-300 bg-white text-[var(--cohi-text-dark)]',
    'focus:outline-none focus:border-[var(--cohi-primary)] focus:ring-1 focus:ring-[var(--cohi-primary)]',
    'disabled:opacity-50 disabled:cursor-not-allowed',
    'data-[placeholder]:text-gray-400'
);

const contentStyles = cn(
    'overflow-hidden bg-white rounded-lg shadow-lg border border-gray-200 z-50',
    'animate-in fade-in-0 zoom-in-95'
);

const itemStyles = cn(
    'relative flex items-center px-3 py-2 rounded-md text-sm text-[var(--cohi-text-dark)] cursor-pointer select-none',
    'data-[highlighted]:bg-[var(--cohi-bg-warm)] data-[highlighted]:outline-none',
    'data-[state=checked]:font-medium',
    'data-[disabled]:opacity-50 data-[disabled]:pointer-events-none'
);

function SelectItem({ value, label }: SelectOption) {
    return (
        <SelectPrimitive.Item value={value} className={itemStyles}>
            <SelectPrimitive.ItemText>{label}</SelectPrimitive.ItemText>
            <SelectPrimitive.ItemIndicator className="absolute right-2">
                <CheckIcon className="w-4 h-4 text-[var(--cohi-primary)]" />
            </SelectPrimitive.ItemIndicator>
        </SelectPrimitive.Item>
    );
}

export const Select = forwardRef<HTMLButtonElement, SelectProps>(
    function Select(
        {
            value,
            defaultValue,
            onValueChange,
            options,
            placeholder = '선택하세요',
            className,
            disabled = false,
            'data-testid': testId,
        },
        ref
    ) {
        const renderedOptions = useMemo(
            () => options.map((option) => <SelectItem key={option.value} {...option} />),
            [options]
        );

        return (
            <SelectPrimitive.Root
                value={value}
                defaultValue={defaultValue}
                onValueChange={onValueChange}
                disabled={disabled}
            >
                <SelectPrimitive.Trigger
                    ref={ref}
                    data-testid={testId}
                    className={cn(triggerStyles, className)}
                >
                    <SelectPrimitive.Value placeholder={placeholder} />
                    <SelectPrimitive.Icon asChild>
                        <ChevronDownIcon className="w-4 h-4 text-gray-500 transition-transform duration-200 data-[state=open]:rotate-180" />
                    </SelectPrimitive.Icon>
                </SelectPrimitive.Trigger>

                <SelectPrimitive.Portal>
                    <SelectPrimitive.Content
                        className={contentStyles}
                        position="popper"
                        sideOffset={4}
                    >
                        <SelectPrimitive.Viewport className="p-1 max-h-60">
                            {renderedOptions}
                        </SelectPrimitive.Viewport>
                    </SelectPrimitive.Content>
                </SelectPrimitive.Portal>
            </SelectPrimitive.Root>
        );
    }
);
