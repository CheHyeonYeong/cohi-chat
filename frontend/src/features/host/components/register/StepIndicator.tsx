interface StepIndicatorProps {
    currentStep: number;
    totalSteps: number;
}

export default function StepIndicator({ currentStep, totalSteps }: StepIndicatorProps) {
    return (
        <div className="flex items-center justify-center gap-0">
            {Array.from({ length: totalSteps }, (_, i) => {
                const step = i + 1;
                const isActive = step === currentStep;
                const isCompleted = step < currentStep;

                return (
                    <div key={step} className="flex items-center">
                        {/* Step circle */}
                        <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                                isActive
                                    ? 'bg-[var(--cohe-primary)] text-white'
                                    : isCompleted
                                        ? 'bg-[var(--cohe-primary)] text-white'
                                        : 'bg-[rgb(var(--cohe-bg-warm))] text-[var(--cohe-text-dark)]'
                            }`}
                        >
                            {isCompleted ? '✓' : step}
                        </div>

                        {/* Label for active step */}
                        {isActive && (
                            <span className="ml-2 text-sm font-semibold text-[var(--cohe-text-dark)]">
                                호스트 등록 ({currentStep}/{totalSteps})
                            </span>
                        )}

                        {/* Connector line */}
                        {step < totalSteps && (
                            <div
                                className={`w-12 h-0.5 mx-2 ${
                                    isCompleted ? 'bg-[var(--cohe-primary)]' : 'bg-[rgb(var(--cohe-bg-warm))]'
                                }`}
                            />
                        )}
                    </div>
                );
            })}
        </div>
    );
}
