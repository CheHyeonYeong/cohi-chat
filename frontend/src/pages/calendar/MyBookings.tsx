import { useSearch, useNavigate } from '@tanstack/react-router';
import LinkButton from '~/components/button/LinkButton';
import PageHeader from '~/components/PageHeader';
import Pagination from '~/components/Pagination';
import { useMyBookings } from '~/features/calendar';
import BookingCard from '~/features/calendar/components/BookingCard';

export default function MyBookings() {
    const { page, pageSize } = useSearch({ from: '/my-bookings' });
    const navigate = useNavigate();
    const { data: bookings, isLoading, error } = useMyBookings({ page, pageSize });

    const handlePageChange = (newPage: number) => {
        navigate({ to: '/my-bookings', search: { page: newPage, pageSize } });
    };

    return (
        <div className="w-full min-h-screen bg-[var(--cohe-bg-light)]">
            <PageHeader />

            <main className="w-full px-6 py-8 pb-16">
                <div className="max-w-4xl mx-auto">
                    <h1 className="text-2xl font-bold text-[var(--cohe-text-dark)] mb-6">내 예약 목록</h1>

                    {isLoading && (
                        <div className="text-center py-16 text-gray-500">내 예약 목록을 불러오고 있습니다...</div>
                    )}

                    {error && (
                        <div className="text-center py-16 space-y-4">
                            <p className="text-red-500">{error.message}</p>
                            <LinkButton variant="primary" to="/login">
                                로그인하기
                            </LinkButton>
                        </div>
                    )}

                    {!isLoading && !error && bookings?.bookings.length === 0 && (
                        <div className="text-center py-16 text-gray-500">예약 내역이 없습니다.</div>
                    )}

                    {bookings && bookings.bookings.length > 0 && (
                        <>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                                {bookings.bookings.map((booking) => (
                                    <BookingCard key={booking.id} booking={booking} />
                                ))}
                            </div>

                            <Pagination
                                page={page}
                                pageSize={pageSize}
                                totalCount={bookings.totalCount}
                                onPageChange={handlePageChange}
                            />
                        </>
                    )}
                </div>
            </main>
        </div>
    );
}
