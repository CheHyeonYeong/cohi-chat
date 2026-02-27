import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useQueryClient } from '@tanstack/react-query';
import Button from '~/components/button/Button';
import { Header } from '~/components/header';
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
    const [tokenRefreshFailed, setTokenRefreshFailed] = useState(false);
    const [isCompleted, setIsCompleted] = useState(false);
    const createCalendarMutation = useCreateCalendar();
    const navigate = useNavigate();
    const queryClient = useQueryClient();

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
            createCalendarMutation.reset();
            setCurrentStep(currentStep + 1);
        }
    };

    const handlePrev = () => {
        if (currentStep > 1) {
            setErrors({});
            createCalendarMutation.reset();
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
                    // 성공 상태를 먼저 설정하여 mutation 상태 변경에 관계없이 성공 UI 유지
                    setIsCompleted(true);
                    try {
                        const response = await refreshTokenApi();
                        localStorage.setItem('auth_token', response.accessToken);
                        localStorage.setItem('refresh_token', response.refreshToken);
                    } catch {
                        // 토큰 갱신 실패 - 사용자에게 재로그인 필요 알림
                        setTokenRefreshFailed(true);
                    }
                    // auth 캐시를 무효화하여 HostGuard가 새 역할(HOST)을 인식하도록 함
                    await queryClient.invalidateQueries({ queryKey: ['auth'] });
                    dispatchAuthChange();
                },
            },
        );
    };

    const handleGoTimeslots = () => {
        navigate({ to: '/host/timeslots' });
    };

    const handleGoHome = () => {
        navigate({ to: '/' });
    };

    return (
        <div className="w-full min-h-screen bg-[var(--cohe-bg-light)]">
            {/* Header */}
            <Header
                center={<StepIndicator currentStep={currentStep} totalSteps={TOTAL_STEPS} />}
                right={<div className="w-24" />}
            />

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
                        isSuccess={isCompleted}
                        tokenRefreshFailed={tokenRefreshFailed}
                        onSubmit={handleSubmit}
                    />
                )}
            </main>

            {/* Bottom Navigation */}
            <footer className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-6 py-4">
                <div className="max-w-4xl mx-auto flex justify-between items-center">
                    {isCompleted ? (
                        <>
                            <Button
                                variant="outline"
                                size="md"
                                onClick={handleGoHome}
                                className="rounded-lg"
                            >
                                홈으로
                            </Button>
                            <div className="flex gap-2">
                                {Array.from({ length: TOTAL_STEPS }, (_, i) => (
                                    <div
                                        key={i}
                                        className="w-2.5 h-2.5 rounded-full bg-[var(--cohe-primary)]"
                                    />
                                ))}
                            </div>
                            <Button
                                variant="primary"
                                size="md"
                                onClick={handleGoTimeslots}
                                className="rounded-lg"
                            >
                                시간 설정하기
                            </Button>
                        </>
                    ) : (
                        <>
                            <Button
                                variant="outline"
                                size="md"
                                onClick={handlePrev}
                                disabled={currentStep === 1}
                                className="rounded-lg"
                            >
                                이전
                            </Button>

                            {/* Step dots */}
                            <div className="flex gap-2">
                                {Array.from({ length: TOTAL_STEPS }, (_, i) => (
                                    <div
                                        key={i}
                                        className={`w-2.5 h-2.5 rounded-full transition-colors ${
                                            i + 1 === currentStep
                                                ? 'bg-[var(--cohe-primary)]'
                                                : 'bg-[rgb(var(--cohe-bg-warm))]'
                                        }`}
                                    />
                                ))}
                            </div>

                            {currentStep < TOTAL_STEPS ? (
                                <Button
                                    variant="primary"
                                    size="md"
                                    onClick={handleNext}
                                    className="rounded-lg"
                                >
                                    다음 단계
                                </Button>
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
