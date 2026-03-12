import { useEffect, useState } from 'react';
import { useParams, useNavigate } from '@tanstack/react-router';
import { PageLayout } from '~/components';
import { Card } from '~/components/card';
import { LinkButton } from '~/components/button/LinkButton';
import { HostProfileCard } from '~/features/host/components/HostProfileCard';
import { HostTopicTags } from '~/features/host/components/HostTopicTags';
import { Body, Navigator, getCalendarDays } from '~/components/calendar';
import { useHostProfile, useHostCalendar, useHostTimeslots } from '~/features/host/hooks/useHostProfile';

const DEFAULT_TOPICS = ['개발 커리어', '이직 준비', '기술 면접', '스타트업 경험', '코드 리뷰'];

export function Profile() {
    const { hostId } = useParams({ from: '/host/$hostId' });
    useEffect(() => { window.scrollTo(0, 0); }, [hostId]);
    const navigate = useNavigate();
    const { data: host, isLoading: isHostLoading, error: hostError } = useHostProfile(hostId);
    const { data: calendar } = useHostCalendar(hostId);
    const { data: timeslots = [] } = useHostTimeslots(host?.id);

    const topics = calendar?.topics && calendar.topics.length > 0 ? calendar.topics : DEFAULT_TOPICS;
    const description = calendar?.description;

    const now = new Date();
    const [year, setYear] = useState(now.getFullYear());
    const [month, setMonth] = useState(now.getMonth() + 1);

    const handlePrevMonth = (_slug: string, date: { year: number; month: number }) => {
        setYear(date.year);
        setMonth(date.month);
    };

    const handleNextMonth = (_slug: string, date: { year: number; month: number }) => {
        setYear(date.year);
        setMonth(date.month);
    };

    const handleSelectDay = (date: Date) => {
        if (!host) return;
        navigate({
            to: '/booking/new/$slug',
            params: { slug: host.username },
            search: { year: date.getFullYear(), month: date.getMonth() + 1 },
        });
    };

    return (
        <PageLayout title={host ? `${host.displayName}님의 프로필` : '호스트 프로필'} >
                {isHostLoading && (
                    <div data-testid="host-profile-loading" className="text-center py-16 text-gray-500">
                        프로필을 불러오는 중...
                    </div>
                )}

                {hostError && (
                    <div data-testid="host-profile-error" className="text-center py-16">
                        <p className="text-red-500">{(hostError as Error).message}</p>
                        <LinkButton variant="outline" to="/" className="mt-4">
                            홈으로 돌아가기
                        </LinkButton>
                    </div>
                )}

                {host && (
                    <div className="flex flex-col md:flex-row gap-8">
                        <div className="md:w-2/5 md:min-w-[280px] space-y-6">
                            <HostProfileCard host={host} />

                            {description && (
                                <section data-testid="host-profile-description">
                                    <h2 className="text-lg font-semibold text-[var(--cohi-text-dark)] mb-3">소개</h2>
                                    <p className="text-gray-700 leading-relaxed">{description}</p>
                                </section>
                            )}

                            <section data-testid="host-profile-topics">
                                <h2 className="text-lg font-semibold text-[var(--cohi-text-dark)] mb-3">토픽</h2>
                                <HostTopicTags topics={topics} />
                            </section>
                        </div>

                        <div className="flex-1 min-w-0">
                            <section data-testid="host-profile-calendar">
                                <Card variant="elevated" title="예약 가능한 시간">
                                    <Navigator
                                        slug={host.username}
                                        year={year}
                                        month={month}
                                        onPrevious={handlePrevMonth}
                                        onNext={handleNextMonth}
                                    />
                                    <div className="mt-4">
                                        <Body
                                            year={year}
                                            month={month}
                                            days={getCalendarDays(new Date(year, month - 1))}
                                            timeslots={timeslots}
                                            bookings={[]}
                                            onSelectDay={handleSelectDay}
                                        />
                                    </div>
                                </Card>
                                <div className="mt-6 flex justify-end">
                                    <LinkButton
                                        variant="primary"
                                        size="lg"
                                        to="/booking/new/$slug"
                                        params={{ slug: host.username }}
                                        search={{ year, month }}
                                        data-testid="host-profile-booking-cta"
                                    >
                                        미팅 예약하기
                                    </LinkButton>
                                </div>
                            </section>
                        </div>
                    </div>
                )}
        </PageLayout>
    );
}
