import { Link, useSearch } from '@tanstack/react-router';
import { useState } from 'react';
import CoffeeCupIcon from '~/components/icons/CoffeeCupIcon';
import LinkButton from '~/components/button/LinkButton';
import { LogoutButton } from '~/components/button/LogoutButton';
import { useAuth } from '~/features/member';
import Pagination from '~/components/Pagination';
import { useMyBookings } from '~/features/calendar';
import BookingCard from '~/features/calendar/components/BookingCard';

export default function MyBookings() {
    const { page, pageSize } = useSearch({ from: '/my-bookings' });
    const [currentPage, setCurrentPage] = useState<number>(page);
    const { data: bookings, isLoading, error } = useMyBookings({ page: currentPage, pageSize });
    const { isAuthenticated } = useAuth();

    return (
        <div className="w-full min-h-screen bg-[var(--cohe-bg-light)]">
            {/* Header */}
            <header className="w-full px-6 py-4 flex justify-between items-center bg-[var(--cohe-bg-warm)]/80 backdrop-blur-sm">
                <Link to="/" className="flex items-center gap-2">
                    <CoffeeCupIcon className="w-8 h-8 text-[var(--cohe-primary)]" />
                    <span className="text-xl font-bold text-[var(--cohe-text-dark)]">coheChat</span>
                </Link>
                <div className="flex items-center gap-3">
                    {isAuthenticated && <LogoutButton />}
                </div>
            </header>

            {/* Content */}
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
                                page={currentPage}
                                pageSize={pageSize}
                                totalCount={bookings.totalCount}
                                onPageChange={setCurrentPage}
                            />
                        </>
                    )}
                </div>
            </main>
        </div>
    );
}
