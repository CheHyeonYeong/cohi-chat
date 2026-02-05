import { Link } from '@tanstack/react-router';
import { useMyBookings } from '~/hooks/useBookings';

export default function MyBookings() {
    const { data: bookings, isLoading, error } = useMyBookings();

    return (
        <div className="space-y-4">
            <Link to='/app' className='bg-gray-500 hover:bg-gray-700 hover:text-white text-white px-4 py-2 rounded-md'>첫 화면으로</Link>

            <h2 className="text-2xl font-bold">내 예약 목록</h2>

            {isLoading && <div data-testid="loading">내 예약 목록을 불러오고 있습니다...</div>}
            {!!error && <div className="text-red-500 space-y-2" data-testid="error">
                <div className="text-lg font-bold">오류 발생</div>
                <div className="text-sm">{error.message}</div>
                <Link to="/app/login" className="inline-block bg-primary text-white px-4 py-2 rounded-md">로그인하기</Link>
            </div>}

            {bookings && bookings.length === 0 && (
                <div data-testid="empty-bookings">예약이 없습니다.</div>
            )}

            <ul data-testid="bookings-list">
                {bookings?.map((booking) => (
                    <li key={booking.id} className="border-b py-2">
                        <Link to="/app/booking/$id" params={{ id: String(booking.id) as unknown as number }} className="hover:text-primary">
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-500">
                                    {booking.when}
                                </span>
                                <span className="text-sm text-gray-500">
                                    {booking.startTime} - {booking.endTime}
                                </span>
                            </div>

                            <div className="flex items-center space-x-2">
                                <span>{booking.topic}</span>
                                <span className="text-sm text-gray-400">{booking.attendanceStatus}</span>
                            </div>
                        </Link>
                    </li>
                ))}
            </ul>
        </div>
    );
}
