import { useEffect } from 'react';
import { getErrorMessage } from '~/libs/errorUtils';
import { Link, useParams, useSearch, useNavigate } from '@tanstack/react-router';
import { PageLayout } from '~/components';
import { Card } from '~/components/card';
import { useHostProfile, useHostCalendar, useHostTimeslots } from '~/features/host/hooks/useHostProfile';
import { ProfileSidebar } from '~/features/host/components/ProfileSidebar';
import { ProfileCalendarSection } from '~/features/host/components/ProfileCalendarSection';
import { useProfileCalendar } from '~/features/host/hooks/useProfileCalendar';
import { useProfileBookingDetail } from '~/features/host/hooks/useProfileBookingDetail';
import { useBookings, BookingForm, BookingDetailPanel } from '~/features/booking';
import { useAuth } from '~/features/member';

const DEFAULT_TOPICS = ['개발 커리어', '이직 준비', '기술 면접', '스타트업 경험', '코드 리뷰'];

export const Profile = () => {
    const { hostId } = useParams({ from: '/host/$hostId' });
    const { selectedBookingId } = useSearch({ from: '/host/$hostId' });
    const navigate = useNavigate();
    useEffect(() => { window.scrollTo(0, 0); }, [hostId]);

    const { data: host, isLoading: isHostLoading, error: hostError } = useHostProfile(hostId);
    const { data: calendar } = useHostCalendar(hostId);
    const { data: timeslots = [] } = useHostTimeslots(host?.id);
    const { data: authUser } = useAuth();

    const isSelf = authUser?.username === hostId;
    const topics = calendar?.topics && calendar.topics.length > 0 ? calendar.topics : DEFAULT_TOPICS;

    const calendarState = useProfileCalendar({
        onDateChange: isSelf
            ? () => navigate({ to: '/host/$hostId', params: { hostId }, search: { selectedBookingId: undefined }, replace: true })
            : undefined,
    });

    const { data: bookings = [], refetch: refetchBookings } = useBookings(
        host?.username ?? '', calendarState.selectedDate
    );

    const bookingDetail = useProfileBookingDetail({
        selectedBookingId,
        enabled: isSelf,
        onRefetchBookings: refetchBookings,
    });

    const handleSelectBooking = (bookingId: number) => {
        const nextId = selectedBookingId === bookingId ? undefined : bookingId;
        navigate({ to: '/host/$hostId', params: { hostId }, search: { selectedBookingId: nextId }, replace: true });
        if (nextId && window.innerWidth < 768) {
            setTimeout(() => calendarState.formRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
        }
    };

    const handleBookingCreated = () => {
        calendarState.resetSelection();
        refetchBookings();
    };

    const title = isSelf
        ? '내 프로필 미리보기'
        : host ? `${host.displayName}님과 약속잡기` : '호스트 프로필';

    return (
        <PageLayout title={title}>
            {isHostLoading && (
                <div data-testid="host-profile-loading" className="flex items-center justify-center min-h-[60vh] text-gray-500">
                    프로필을 불러오는 중...
                </div>
            )}

            {hostError && (
                <div data-testid="host-profile-error" className="flex flex-col items-center justify-center min-h-[60vh] text-gray-500 gap-4">
                    <p>{getErrorMessage(hostError)}</p>
                    <Link to="/" className="text-cohi-primary hover:underline">홈으로 돌아가기</Link>
                </div>
            )}

            {host && (
                <div className="flex flex-col md:flex-row gap-6">
                    <ProfileSidebar host={host} description={calendar?.description} topics={topics} />

                    <div className="flex-1 min-w-0 space-y-6">
                        <ProfileCalendarSection
                            isSelf={isSelf}
                            username={host.username}
                            calendar={calendarState}
                            timeslots={timeslots}
                            bookings={bookings}
                            selectedBookingId={selectedBookingId}
                            onSelectBooking={handleSelectBooking}
                        />

                        {isSelf && selectedBookingId && bookingDetail.selectedBooking && bookingDetail.selectedBooking.id === selectedBookingId && (
                            <div ref={calendarState.formRef} data-testid="host-profile-booking-detail">
                                <BookingDetailPanel
                                    booking={bookingDetail.selectedBooking}
                                    onUpload={bookingDetail.handleUpload}
                                    onDownload={bookingDetail.handleDownload}
                                    onDelete={bookingDetail.handleDelete}
                                    isUploading={bookingDetail.isUploading}
                                    isDeleting={bookingDetail.isDeleting}
                                    uploadError={bookingDetail.uploadError}
                                    role="host"
                                    counterpart={bookingDetail.selectedBooking.guest}
                                />
                            </div>
                        )}

                        {!isSelf && calendarState.selectedDate && calendarState.selectedTimeslot && calendar && (
                            <div ref={calendarState.formRef} data-testid="host-profile-booking-form">
                                <Card title="예약 정보">
                                    <BookingForm
                                        slug={host.username}
                                        calendar={calendar}
                                        timeSlotId={calendarState.selectedTimeslot.id}
                                        when={calendarState.selectedDate}
                                        onCreated={handleBookingCreated}
                                    />
                                </Card>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </PageLayout>
    );
};
