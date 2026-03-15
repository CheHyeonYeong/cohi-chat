import { cn } from '~/libs/cn';

interface StepIndicatorProps {
    currentStep: number;
    totalSteps: number;
}

export function StepIndicator({ currentStep, totalSteps }: StepIndicatorProps) {
    return (
        <div data-testid="step-indicator" className="flex items-center justify-center gap-0">
            {Array.from({ length: totalSteps }, (_, i) => {
                const step = i + 1;
                const isActive = step === currentStep;
                const isCompleted = step < currentStep;

                return (
                    <div key={step} className="flex items-center">
                        {/* Step circle */}
                        <div
                            className={cn(
                                'w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors',
                                isActive || isCompleted
                                    ? 'bg-[var(--cohi-primary)] text-white'
                                    : 'bg-[var(--cohi-bg-warm)] text-[var(--cohi-text-dark)]'
                            )}
                        >
                            {isCompleted ? '✓' : step}
                        </div>

                        {/* Label for active step */}
                        {isActive && (
                            <span className="ml-2 text-sm font-semibold text-[var(--cohi-text-dark)] hidden sm:inline">
                                호스트 등록 ({currentStep}/{totalSteps})
                            </span>
                        )}

                        {/* Connector line */}
                        {step < totalSteps && (
                            <div
                                className={cn(
                                    'w-6 sm:w-12 h-0.5 mx-1 sm:mx-2',
                                    isCompleted ? 'bg-[var(--cohi-primary)]' : 'bg-[var(--cohi-bg-warm)]'
                                )}
                            />
                        )}
                    </div>
                );
            })}
        </div>
    );
}
