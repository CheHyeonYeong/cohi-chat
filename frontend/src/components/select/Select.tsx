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
    'data-testid'?: string;
}

export function Select({
    value,
    defaultValue,
    onValueChange,
    options,
    placeholder = '선택하세요',
    className,
    'data-testid': testId,
}: SelectProps) {
    return (
        <SelectPrimitive.Root value={value} defaultValue={defaultValue} onValueChange={onValueChange}>
            <SelectPrimitive.Trigger
                data-testid={testId}
                className={cn(
                    'flex items-center justify-between w-full px-4 py-3 rounded-lg border border-gray-300 bg-white text-[var(--cohi-text-dark)]',
                    'focus:outline-none focus:border-[var(--cohi-primary)] focus:ring-1 focus:ring-[var(--cohi-primary)]',
                    'data-[placeholder]:text-gray-400',
                    className
                )}
            >
                <SelectPrimitive.Value placeholder={placeholder} />
                <SelectPrimitive.Icon>
                    <ChevronDownIcon className="w-4 h-4 text-gray-500" />
                </SelectPrimitive.Icon>
            </SelectPrimitive.Trigger>

            <SelectPrimitive.Portal>
                <SelectPrimitive.Content
                    className="overflow-hidden bg-white rounded-lg shadow-lg border border-gray-200 z-50"
                    position="popper"
                    sideOffset={4}
                >
                    <SelectPrimitive.Viewport className="p-1 max-h-60">
                        {options.map((option) => (
                            <SelectPrimitive.Item
                                key={option.value}
                                value={option.value}
                                className={cn(
                                    'relative flex items-center px-3 py-2 rounded-md text-sm text-[var(--cohi-text-dark)] cursor-pointer',
                                    'data-[highlighted]:bg-[var(--cohi-bg-warm)] data-[highlighted]:outline-none',
                                    'data-[state=checked]:font-medium'
                                )}
                            >
                                <SelectPrimitive.ItemText>{option.label}</SelectPrimitive.ItemText>
                                <SelectPrimitive.ItemIndicator className="absolute right-2">
                                    <CheckIcon className="w-4 h-4 text-[var(--cohi-primary)]" />
                                </SelectPrimitive.ItemIndicator>
                            </SelectPrimitive.Item>
                        ))}
                    </SelectPrimitive.Viewport>
                </SelectPrimitive.Content>
            </SelectPrimitive.Portal>
        </SelectPrimitive.Root>
    );
}
