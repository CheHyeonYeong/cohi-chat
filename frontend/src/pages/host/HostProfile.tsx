import { useParams } from '@tanstack/react-router';
import { Header } from '~/components/header';
import LinkButton from '~/components/button/LinkButton';
import { LogoutButton } from '~/components/button/LogoutButton';
import { useAuth } from '~/features/member';
import HostProfileCard from '~/features/host/components/HostProfileCard';
import HostTopicTags from '~/features/host/components/HostTopicTags';
import HostTimeSlotPreview from '~/features/host/components/HostTimeSlotPreview';
import { useHostProfile, useHostCalendar, useHostTimeslots } from '~/features/host/hooks/useHostProfile';

const DEFAULT_TOPICS = ['개발 커리어', '이직 준비', '기술 면접', '스타트업 경험', '코드 리뷰'];

export default function HostProfile() {
    const { hostId } = useParams({ from: '/host/$hostId' });
    const { isAuthenticated } = useAuth();
    const { data: host, isLoading: isHostLoading, error: hostError } = useHostProfile(hostId);
    const { data: calendar } = useHostCalendar(hostId);
    const { data: timeslots = [], isLoading: isTimeslotsLoading } = useHostTimeslots(host?.id);

    const topics = calendar?.topics && calendar.topics.length > 0 ? calendar.topics : DEFAULT_TOPICS;
    const description = calendar?.description;

    const now = new Date();

    return (
        <div className="w-full min-h-screen bg-[var(--cohe-bg-light)]">
            <Header
                right={
                    <div className="flex items-center gap-3">
                        {isAuthenticated ? (
                            <LogoutButton />
                        ) : (
                            <LinkButton variant="outline" to="/login">
                                로그인
                            </LinkButton>
                        )}
                    </div>
                }
            />

            <main className="max-w-4xl mx-auto px-6 py-8">
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
                    <>
                        <HostProfileCard host={host} />

                        {description && (
                            <section data-testid="host-profile-description" className="mt-8">
                                <h2 className="text-lg font-semibold text-[var(--cohe-text-dark)] mb-3">소개</h2>
                                <p className="text-gray-700 leading-relaxed">{description}</p>
                            </section>
                        )}

                        <section data-testid="host-profile-topics" className="mt-8">
                            <h2 className="text-lg font-semibold text-[var(--cohe-text-dark)] mb-3">토픽</h2>
                            <HostTopicTags topics={topics} />
                        </section>

                        <section data-testid="host-profile-timeslots" className="mt-8">
                            <h2 className="text-lg font-semibold text-[var(--cohe-text-dark)] mb-3">예약 가능 시간</h2>
                            <HostTimeSlotPreview timeslots={timeslots} isLoading={isTimeslotsLoading} />
                        </section>

                        <div className="mt-8 text-center">
                            <LinkButton
                                variant="primary"
                                size="lg"
                                to="/calendar/$slug"
                                params={{ slug: host.username }}
                                search={{ year: now.getFullYear(), month: now.getMonth() + 1 }}
                                data-testid="host-profile-booking-cta"
                            >
                                미팅 예약하기
                            </LinkButton>
                        </div>
                    </>
                )}
            </main>
        </div>
    );
}
