import { useEffect, useState, useRef } from 'react';
import { getErrorMessage } from '~/libs/errorUtils';
import { Link, useParams, useSearch, useNavigate } from '@tanstack/react-router';
import { PageLayout } from '~/components';
import { Card } from '~/components/card';
import { HostProfileCard } from '~/features/host/components/HostProfileCard';
import { HostTopicTags } from '~/features/host/components/HostTopicTags';
import { Body, Navigator, Timeslots, BookedTimeslots, getCalendarDays } from '~/components/calendar';
import type { ITimeSlot } from '~/components/calendar';
import { useHostProfile, useHostCalendar, useHostTimeslots } from '~/features/host/hooks/useHostProfile';
import { useBookings, useBooking, useUploadBookingFile, useDeleteBookingFile, useDownloadBookingFile, BookingForm, BookingDetailPanel } from '~/features/booking';
import { useAuth } from '~/features/member';
import { useToast } from '~/components/toast/useToast';
import { getErrorMessage } from '~/libs/errorUtils';

const DEFAULT_TOPICS = ['개발 커리어', '이직 준비', '기술 면접', '스타트업 경험', '코드 리뷰'];

export const Profile = () => {
    const { hostId } = useParams({ from: '/host/$hostId' });
    const { selectedBookingId } = useSearch({ from: '/host/$hostId' });
    const navigate = useNavigate();
    const { showToast } = useToast();
    useEffect(() => { window.scrollTo(0, 0); }, [hostId]);

    const { data: host, isLoading: isHostLoading, error: hostError } = useHostProfile(hostId);
    const { data: calendar } = useHostCalendar(hostId);
    const { data: timeslots = [] } = useHostTimeslots(host?.id);
    const { data: authUser } = useAuth();

    const topics = calendar?.topics && calendar.topics.length > 0 ? calendar.topics : DEFAULT_TOPICS;
    const description = calendar?.description;

    const now = new Date();
    const [year, setYear] = useState(now.getFullYear());
    const [month, setMonth] = useState(now.getMonth() + 1);
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [selectedTimeslot, setSelectedTimeslot] = useState<ITimeSlot | null>(null);

    const { data: bookings = [], refetch: refetchBookings } = useBookings(
        host?.username ?? '', selectedDate
    );

    const isSelf = authUser?.username === hostId;

    // 호스트 미리보기: 선택된 예약 상세
    const { data: selectedBooking, refetch: refetchSelectedBooking } = useBooking(
        isSelf ? (selectedBookingId ?? null) : null
    );
    const { mutateAsync: uploadFileAsync, isPending: isUploading, error: uploadError, reset: resetUploadError } = useUploadBookingFile(selectedBookingId ?? 0);
    const { mutateAsync: deleteFileAsync, isPending: isDeleting } = useDeleteBookingFile(selectedBookingId ?? 0);
    const { mutate: downloadFile } = useDownloadBookingFile(selectedBookingId ?? 0);

    const timeslotsRef = useRef<HTMLDivElement>(null);
    const formRef = useRef<HTMLDivElement>(null);

    const handlePrevMonth = (_slug: string, date: { year: number; month: number }) => {
        setYear(date.year);
        setMonth(date.month);
    };

    const handleNextMonth = (_slug: string, date: { year: number; month: number }) => {
        setYear(date.year);
        setMonth(date.month);
    };

    const isMobile = () => window.innerWidth < 768;

    const handleSelectDay = (date: Date) => {
        setSelectedDate(date);
        setSelectedTimeslot(null);
        if (isSelf) {
            navigate({ to: '/host/$hostId', params: { hostId }, search: { selectedBookingId: undefined }, replace: true });
        }
        if (isMobile()) {
            setTimeout(() => timeslotsRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
        }
    };

    const handleSelectTimeslot = (timeslot: ITimeSlot) => {
        setSelectedTimeslot(timeslot);
        if (isMobile()) {
            setTimeout(() => formRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
        }
    };

    const handleSelectBooking = (bookingId: number) => {
        const nextId = selectedBookingId === bookingId ? undefined : bookingId;
        navigate({ to: '/host/$hostId', params: { hostId }, search: { selectedBookingId: nextId }, replace: true });
        if (nextId && isMobile()) {
            setTimeout(() => formRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
        }
    };

    const handleBookingCreated = () => {
        setSelectedTimeslot(null);
        setSelectedDate(null);
        refetchBookings();
    };

    const handleUpload = async (files: FileList) => {
        if (!selectedBookingId) return;
        resetUploadError();
        try {
            for (const file of files) {
                await uploadFileAsync(file);
            }
            await Promise.all([refetchSelectedBooking(), refetchBookings()]);
        } catch {
            // 파일 선택 유지하여 사용자가 다른 파일로 재시도 가능
        }
    };

    const handleDownload = (fileId: number, fileName: string) => {
        if (!selectedBookingId) return;
        downloadFile({ fileId, fileName });
    };

    const handleDelete = async (fileId: number) => {
        if (!selectedBookingId) return;
        try {
            await deleteFileAsync(fileId);
            await refetchSelectedBooking();
        } catch (err) {
            showToast(getErrorMessage(err, '파일 삭제 실패'), 'profile-preview-delete-error');
        }
    };

    const title = isSelf
        ? '내 프로필 미리보기'
        : host ? `${host.displayName}님과 약속잡기` : '호스트 프로필';

    const calendarTitle = isSelf ? '나에게 예약된 시간' : '예약 가능한 시간';

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
                    <div className="md:w-1/3 md:min-w-[240px] space-y-6">
                        <HostProfileCard host={host} />

                        {description && (
                            <section data-testid="host-profile-description">
                                <h2 className="text-lg font-semibold text-cohi-text-dark mb-3">소개</h2>
                                <p className="text-gray-700 leading-relaxed">{description}</p>
                            </section>
                        )}

                        <section data-testid="host-profile-topics">
                            <h2 className="text-lg font-semibold text-cohi-text-dark mb-3">토픽</h2>
                            <HostTopicTags topics={topics} />
                        </section>
                    </div>

                    <div className="flex-1 min-w-0 space-y-6">
                        <section data-testid="host-profile-calendar">
                            <Card variant="elevated" title={calendarTitle}>
                                <div className="flex flex-col md:flex-row gap-6">
                                    <div className="flex-1 min-w-0">
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
                                                bookings={bookings}
                                                selectedDate={selectedDate}
                                                onSelectDay={handleSelectDay}
                                            />
                                        </div>
                                    </div>

                                    <div ref={timeslotsRef} className="md:w-[200px] md:min-w-[200px]" data-testid="host-profile-timeslots">
                                        {isSelf && selectedDate ? (
                                            <BookedTimeslots
                                                bookings={bookings}
                                                baseDate={selectedDate}
                                                selectedBookingId={selectedBookingId}
                                                onSelectBooking={handleSelectBooking}
                                            />
                                        ) : !isSelf && selectedDate ? (
                                            <Timeslots
                                                timeslots={timeslots}
                                                bookings={bookings}
                                                baseDate={selectedDate}
                                                onSelectTimeslot={handleSelectTimeslot}
                                            />
                                        ) : (
                                            <div className="hidden md:flex flex-col items-center justify-center h-full text-center text-gray-400 space-y-3 py-8">
                                                <span className="text-4xl">&#x1F4C5;</span>
                                                <p className="text-sm leading-relaxed">
                                                    날짜를 선택하면<br />
                                                    {isSelf ? '예약된 시간대가' : '예약 가능한 시간대가'}<br />
                                                    표시됩니다
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </Card>
                        </section>

                        {isSelf && selectedBookingId && selectedBooking && selectedBooking.id === selectedBookingId && (
                            <div ref={formRef} data-testid="host-profile-booking-detail">
                                <BookingDetailPanel
                                    booking={selectedBooking}
                                    onUpload={handleUpload}
                                    onDownload={handleDownload}
                                    onDelete={handleDelete}
                                    isUploading={isUploading}
                                    isDeleting={isDeleting}
                                    uploadError={uploadError}
                                    role="host"
                                    counterpart={selectedBooking.guest}
                                />
                            </div>
                        )}

                        {!isSelf && selectedDate && selectedTimeslot && calendar && (
                            <div ref={formRef} data-testid="host-profile-booking-form">
                                <Card title="예약 정보">
                                    <BookingForm
                                        slug={host.username}
                                        calendar={calendar}
                                        timeSlotId={selectedTimeslot.id}
                                        when={selectedDate}
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
