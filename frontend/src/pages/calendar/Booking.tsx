import { Link, useParams } from "@tanstack/react-router";
import { useBooking } from "~/hooks/useBookings";

export default function Booking() {
    const { id } = useParams({ from: '/app/booking/$id' });
    const { data: booking, isLoading, error } = useBooking(Number(id));

    if (isLoading) return <div data-testid="loading">예약 정보를 불러오고 있습니다...</div>;
    if (error) return <div data-testid="error">예약 정보를 불러오는 중 오류가 발생했습니다.</div>;
    if (!booking) return null;

    return <div className="flex flex-col space-y-4">
        <Link to='/app/my-bookings' className='inline-block w-fit bg-gray-500 hover:bg-gray-700 hover:text-white text-white px-4 py-2 rounded-md'>내 예약 목록으로</Link>

        <h1 className="text-2xl font-bold">예약 상세</h1>

        <div className="flex flex-col space-y-2">
            <div className="flex flex-row space-x-2 items-center">
                <span className="font-semibold">주제:</span>
                <span>{booking.topic}</span>
            </div>
            <div className="flex flex-row space-x-2 items-center">
                <span className="font-semibold">날짜:</span>
                <span>{booking.when}</span>
            </div>
            <div className="flex flex-row space-x-2 items-center">
                <span className="font-semibold">시간:</span>
                <span>{booking.startTime} - {booking.endTime}</span>
            </div>
            <div className="flex flex-row space-x-2 items-center">
                <span className="font-semibold">상태:</span>
                <span>{booking.attendanceStatus}</span>
            </div>
            <div className="flex flex-col space-y-1">
                <span className="font-semibold">설명:</span>
                <p>{booking.description}</p>
            </div>
        </div>
    </div>;
}
