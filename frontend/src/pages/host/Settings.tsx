import { useEffect, useRef, useState } from 'react';
import { Button } from '~/components/button';
import { LinkButton } from '~/components/button/LinkButton';
import { Card } from '~/components/card';
import { PageLayout } from '~/components';
import { MeetingInfoForm, GoogleCalendarSetup, useMyCalendar, useUpdateCalendar } from '~/features/host';
import { validateCalendarData } from '~/features/host/utils/validation';
import { getErrorMessage } from '~/libs/errorUtils';

export function Settings() {
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
            // 비동기 서버 데이터를 폼 상태에 1회 초기화 — syncedRef로 사용자 편집 후 재동기화 방지
            /* eslint-disable react-hooks/set-state-in-effect */
            setTopics(calendar.topics);
            setDescription(calendar.description);
            setGoogleCalendarId(calendar.googleCalendarId);
            /* eslint-enable react-hooks/set-state-in-effect */
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
            <PageLayout title="호스트 설정">
                <div className="flex items-center justify-center py-12">
                    <Card size="lg" className="flex flex-col p-10 text-center max-w-md space-y-6">
                        <div className="text-5xl">📅</div>
                        <h2 className="text-xl font-bold text-cohi-text-dark">연동된 캘린더가 없습니다</h2>
                        <p className="text-gray-600">
                            미팅 예약을 받으려면 먼저 Google 캘린더를 연동해야 합니다.
                        </p>
                        <LinkButton variant="primary" to="/host/register" size="lg" className="w-full">
                            캘린더 연동하러 가기
                        </LinkButton>
                    </Card>
                </div>
            </PageLayout>
        );
    }

    return (
        <PageLayout title="호스트 설정">
            <div className="space-y-8">
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
                        noShadow
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
            </div>
        </PageLayout>
    );
}
