/**
 * 로컬 개발 전용 패널 - import.meta.env.DEV일 때만 렌더링됨
 * 노쇼 신고처럼 시간 조건이 있는 기능을 로컬에서 바로 테스트할 때 사용
 */
import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { API_URL } from '~/features/calendar/api/constants';
import { httpClient } from '~/libs/httpClient';

export function DevPanel() {
    const navigate = useNavigate();
    const [timeSlotId, setTimeSlotId] = useState('');
    const [daysAgo, setDaysAgo] = useState(1);
    const [isOpen, setIsOpen] = useState(false);
    const [status, setStatus] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleCreate = async () => {
        if (!timeSlotId) {
            setStatus('❌ timeSlotId를 입력하세요');
            return;
        }
        setIsLoading(true);
        setStatus(null);
        try {
            const bookingId = await httpClient<number>(
                `${API_URL}/dev/bookings/past?timeSlotId=${timeSlotId}&daysAgo=${daysAgo}`,
                { method: 'POST' }
            );
            setStatus(`✅ 예약 생성됨 (id: ${bookingId})`);
            navigate({ to: '/booking/$id', params: { id: bookingId } });
        } catch (e) {
            setStatus(`❌ 실패: ${e instanceof Error ? e.message : String(e)}`);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed bottom-4 right-4 z-50 font-mono text-xs">
            {isOpen ? (
                <div className="bg-gray-900 text-gray-100 rounded-xl shadow-2xl p-4 w-64 flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                        <span className="text-yellow-400 font-bold">⚗️ DEV</span>
                        <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-white">✕</button>
                    </div>

                    <div className="flex flex-col gap-1">
                        <label className="text-gray-400">과거 예약 생성</label>
                        <input
                            type="number"
                            placeholder="timeSlotId"
                            value={timeSlotId}
                            onChange={e => setTimeSlotId(e.target.value)}
                            className="bg-gray-800 text-white rounded px-2 py-1 w-full"
                        />
                        <div className="flex items-center gap-2">
                            <input
                                type="number"
                                placeholder="며칠 전"
                                value={daysAgo}
                                onChange={e => setDaysAgo(Number(e.target.value))}
                                className="bg-gray-800 text-white rounded px-2 py-1 w-20"
                                min="1"
                            />
                            <span className="text-gray-400">일 전 예약</span>
                        </div>
                        <button
                            onClick={handleCreate}
                            disabled={isLoading}
                            className="bg-yellow-500 hover:bg-yellow-400 disabled:opacity-50 text-black rounded px-3 py-1 font-bold mt-1"
                        >
                            {isLoading ? '생성 중...' : '예약 생성 → 이동'}
                        </button>
                    </div>

                    {status && <p className="text-xs break-all">{status}</p>}

                    <p className="text-gray-600 text-[10px]">
                        timeSlotId는 Swagger /api/timeslots 또는 DB에서 확인
                    </p>
                </div>
            ) : (
                <button
                    onClick={() => setIsOpen(true)}
                    className="bg-yellow-500 hover:bg-yellow-400 text-black font-bold rounded-full w-10 h-10 shadow-lg text-sm"
                >
                    ⚗️
                </button>
            )}
        </div>
    );
}
