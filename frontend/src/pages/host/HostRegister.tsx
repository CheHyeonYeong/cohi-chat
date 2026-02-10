import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import CoffeeCupIcon from '~/components/icons/CoffeeCupIcon';
import StepIndicator from '~/features/host/components/register/StepIndicator';
import RegisterStep1, { type Step1Data } from '~/features/host/components/register/RegisterStep1';
import RegisterStep2, { type Step2Data, CALENDAR_ID_REGEX } from '~/features/host/components/register/RegisterStep2';
import RegisterStep3 from '~/features/host/components/register/RegisterStep3';
import { useCreateCalendar } from '~/features/host';
import { refreshTokenApi } from '~/features/member/api/memberApi';
import { dispatchAuthChange } from '~/features/member/utils/authEvent';

const TOTAL_STEPS = 3;

export interface WizardData {
    step1: Step1Data;
    step2: Step2Data;
}

const initialData: WizardData = {
    step1: { topics: [], description: '' },
    step2: { googleCalendarId: '' },
};

export default function HostRegister() {
    const [currentStep, setCurrentStep] = useState(1);
    const [data, setData] = useState<WizardData>(initialData);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const createCalendarMutation = useCreateCalendar();
    const navigate = useNavigate();

    const validateStep1 = (): boolean => {
        const newErrors: Record<string, string> = {};
        if (data.step1.topics.length === 0) {
            newErrors.topics = '주제를 최소 1개 이상 입력해주세요.';
        }
        if (data.step1.description.trim().length < 10) {
            newErrors.description = '소개는 최소 10자 이상 입력해주세요.';
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const validateStep2 = (): boolean => {
        const newErrors: Record<string, string> = {};
        const id = data.step2.googleCalendarId;
        if (!id) {
            newErrors.googleCalendarId = 'Google Calendar ID를 입력해주세요.';
        } else if (!CALENDAR_ID_REGEX.test(id)) {
            newErrors.googleCalendarId = 'Google Calendar ID 형식이 올바르지 않습니다. (예: xxx@group.calendar.google.com)';
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleNext = () => {
        if (currentStep === 1 && !validateStep1()) return;
        if (currentStep === 2 && !validateStep2()) return;
        if (currentStep < TOTAL_STEPS) {
            setErrors({});
            setCurrentStep(currentStep + 1);
        }
    };

    const handlePrev = () => {
        if (currentStep > 1) {
            setErrors({});
            setCurrentStep(currentStep - 1);
        }
    };

    const handleSubmit = () => {
        createCalendarMutation.mutate(
            {
                topics: data.step1.topics,
                description: data.step1.description,
                googleCalendarId: data.step2.googleCalendarId,
            },
            {
                onSuccess: async () => {
                    try {
                        const response = await refreshTokenApi();
                        localStorage.setItem('auth_token', response.accessToken);
                        localStorage.setItem('refresh_token', response.refreshToken);
                        dispatchAuthChange();
                    } catch {
                        // 토큰 갱신 실패해도 등록은 완료된 상태
                    }
                },
            },
        );
    };

    const handleGoTimeslots = () => {
        navigate({ to: '/app/host/timeslots' });
    };

    const handleGoHome = () => {
        navigate({ to: '/app' });
    };

    const isCompleted = createCalendarMutation.isSuccess;

    return (
        <div className="w-full min-h-screen bg-[var(--cohe-bg-light)]">
            {/* Header */}
            <header className="w-full px-6 py-4 flex justify-between items-center bg-[var(--cohe-bg-warm)]/80 backdrop-blur-sm">
                <div className="flex items-center gap-2">
                    <CoffeeCupIcon className="w-8 h-8 text-[var(--cohe-primary)]" />
                    <span className="text-xl font-bold text-[var(--cohe-text-dark)]">coheChat</span>
                </div>
                <StepIndicator currentStep={currentStep} totalSteps={TOTAL_STEPS} />
                <div className="w-24" />
            </header>

            {/* Content */}
            <main className="w-full px-6 py-10 md:py-16 pb-28">
                {currentStep === 1 && (
                    <RegisterStep1
                        data={data.step1}
                        onChange={(step1) => setData({ ...data, step1 })}
                        errors={errors}
                    />
                )}
                {currentStep === 2 && (
                    <RegisterStep2
                        data={data.step2}
                        onChange={(step2) => setData({ ...data, step2 })}
                        errors={errors}
                    />
                )}
                {currentStep === 3 && (
                    <RegisterStep3
                        step1={data.step1}
                        step2={data.step2}
                        isPending={createCalendarMutation.isPending}
                        error={createCalendarMutation.error}
                        isSuccess={createCalendarMutation.isSuccess}
                        onSubmit={handleSubmit}
                    />
                )}
            </main>

            {/* Bottom Navigation */}
            <footer className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-6 py-4">
                <div className="max-w-4xl mx-auto flex justify-between items-center">
                    {isCompleted ? (
                        <>
                            <button
                                onClick={handleGoHome}
                                className="px-6 py-2.5 rounded-lg font-medium cohe-btn-outline"
                            >
                                홈으로
                            </button>
                            <div className="flex gap-2">
                                {Array.from({ length: TOTAL_STEPS }, (_, i) => (
                                    <div
                                        key={i}
                                        className="w-2.5 h-2.5 rounded-full bg-[var(--cohe-primary)]"
                                    />
                                ))}
                            </div>
                            <button
                                onClick={handleGoTimeslots}
                                className="px-6 py-2.5 rounded-lg font-medium cohe-btn-primary"
                            >
                                시간 설정하기
                            </button>
                        </>
                    ) : (
                        <>
                            <button
                                onClick={handlePrev}
                                disabled={currentStep === 1}
                                className={`px-6 py-2.5 rounded-lg font-medium transition-colors ${
                                    currentStep === 1
                                        ? 'text-gray-300 cursor-not-allowed'
                                        : 'cohe-btn-outline'
                                }`}
                            >
                                이전
                            </button>

                            {/* Step dots */}
                            <div className="flex gap-2">
                                {Array.from({ length: TOTAL_STEPS }, (_, i) => (
                                    <div
                                        key={i}
                                        className={`w-2.5 h-2.5 rounded-full transition-colors ${
                                            i + 1 === currentStep
                                                ? 'bg-[var(--cohe-primary)]'
                                                : 'bg-[var(--cohe-bg-warm)]'
                                        }`}
                                    />
                                ))}
                            </div>

                            {currentStep < TOTAL_STEPS ? (
                                <button
                                    onClick={handleNext}
                                    className="px-6 py-2.5 rounded-lg font-medium cohe-btn-primary"
                                >
                                    다음 단계
                                </button>
                            ) : (
                                <div className="w-24" />
                            )}
                        </>
                    )}
                </div>
            </footer>
        </div>
    );
}
