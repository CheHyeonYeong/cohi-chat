import { useEffect, useRef, useState } from 'react';
import Button from '~/components/button/Button';
import LinkButton from '~/components/button/LinkButton';
import { Card } from '~/components/card';
import { Header } from '~/components/header';
import { MeetingInfoForm, GoogleCalendarSetup, useMyCalendar, useUpdateCalendar } from '~/features/host';
import { validateCalendarData } from '~/features/host/utils/validation';
import { getErrorMessage } from '~/libs/errorUtils';

export default function CalendarSettings() {
    const { data: calendar, isLoading, error: loadError } = useMyCalendar();
    const updateCalendarMutation = useUpdateCalendar();

    const [topics, setTopics] = useState<string[]>([]);
    const [description, setDescription] = useState('');
    const [googleCalendarId, setGoogleCalendarId] = useState('');
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [saveSuccess, setSaveSuccess] = useState(false);
    const syncedRef = useRef(false);

    useEffect(() => {
        if (calendar && !syncedRef.current) {
            setTopics(calendar.topics);
            setDescription(calendar.description);
            setGoogleCalendarId(calendar.googleCalendarId);
            syncedRef.current = true;
        }
    }, [calendar]);

    const validate = (): boolean => {
        const newErrors = validateCalendarData({
            topics,
            description,
            googleCalendarId,
        });
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSave = async () => {
        if (!validate()) return;
        setSaveSuccess(false);

        try {
            await updateCalendarMutation.mutateAsync({
                topics,
                description,
                googleCalendarId,
            });
            setSaveSuccess(true);
            syncedRef.current = false;
            setTimeout(() => setSaveSuccess(false), 3000);
        } catch (err) {
            setErrors({ submit: getErrorMessage(err, '저장 중 오류가 발생했습니다.') });
        }
    };

    if (isLoading) {
        return (
            <div className="w-full min-h-screen flex items-center justify-center">
                <p className="text-gray-500">불러오는 중...</p>
            </div>
        );
    }

    if (loadError) {
        return (
            <div className="w-full min-h-screen flex items-center justify-center">
                <p className="text-red-500">정보를 불러오지 못했습니다.</p>
            </div>
        );
    }

    if (!calendar) {
        return (
            <div className="w-full min-h-screen bg-[var(--cohi-bg-light)]">
                <Header
                    center={
                        <nav className="text-sm text-gray-500">
                            <span>호스트 대시보드</span>
                            <span className="mx-1.5">&gt;</span>
                            <span className="text-[var(--cohi-text-dark)] font-medium">캘린더 설정</span>
                        </nav>
                    }
                    right={<div className="w-9 h-9"></div>}
                />
                <div className="flex  items-center justify-center py-20 px-6">
                    <Card size="lg" className="flex flex-col p-10 text-center max-w-md space-y-6">
                        <div className="text-5xl">📅</div>
                        <h2 className="text-xl font-bold text-[var(--cohi-text-dark)]">연동된 캘린더가 없습니다</h2>
                        <p className="text-gray-600">
                            미팅 예약을 받으려면 먼저 Google 캘린더를 연동해야 합니다.
                        </p>
                        <LinkButton variant="primary" to="/host/register" size="lg" className="w-full">
                            캘린더 연동하러 가기
                        </LinkButton>
                    </Card>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full min-h-screen bg-[var(--cohi-bg-light)]">
            <Header
                center={
                    <nav className="text-sm text-gray-500">
                        <span>호스트 대시보드</span>
                        <span className="mx-1.5">&gt;</span>
                        <span className="text-[var(--cohi-text-dark)] font-medium">캘린더 설정</span>
                    </nav>
                }
                right={<div className="w-9 h-9"></div>}
            />

            <main className="w-full px-6 py-10 max-w-4xl mx-auto space-y-8">
                <Card size="lg" title="기본 정보 수정">
                    <MeetingInfoForm
                        data={{ topics, description }}
                        onChange={(data) => {
                            setTopics(data.topics);
                            setDescription(data.description);
                        }}
                        errors={errors}
                    />
                </Card>

                <Card size="lg" title="연동 캘린더 수정">
                    <GoogleCalendarSetup
                        data={{ googleCalendarId }}
                        onChange={(data) => setGoogleCalendarId(data.googleCalendarId)}
                        errors={errors}
                    />
                </Card>

                {errors.submit && (
                    <p className="text-red-500 text-sm text-center">{errors.submit}</p>
                )}

                {saveSuccess && (
                    <p className="text-green-600 text-sm text-center font-medium animate-pulse">
                        설정이 성공적으로 저장되었습니다!
                    </p>
                )}

                <div className="flex justify-center pt-4">
                    <Button
                        variant="primary"
                        size="lg"
                        className="w-full max-w-xs rounded-xl"
                        onClick={handleSave}
                        disabled={updateCalendarMutation.isPending}
                    >
                        {updateCalendarMutation.isPending ? '저장 중...' : '저장하기'}
                    </Button>
                </div>
            </main>
        </div>
    );
}
