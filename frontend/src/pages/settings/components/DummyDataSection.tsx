import { useState } from 'react';
import Card from '~/components/card/Card';
import Button from '~/components/button/Button';
import {
    generateDummyDataApi,
    clearDummyDataApi,
    type DummyDataResponse,
} from '~/features/dev/api/devApi';

export function DummyDataSection() {
    const [isGenerating, setIsGenerating] = useState(false);
    const [isClearing, setIsClearing] = useState(false);
    const [result, setResult] = useState<DummyDataResponse | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleGenerate = async () => {
        setIsGenerating(true);
        setError(null);
        try {
            const response = await generateDummyDataApi({
                memberCount: 5,
                hostCount: 2,
                timeSlotCount: 10,
                bookingCount: 5,
            });
            setResult(response);
        } catch (err) {
            setError(err instanceof Error ? err.message : '더미 데이터 생성에 실패했습니다.');
        } finally {
            setIsGenerating(false);
        }
    };

    const handleClear = async () => {
        setIsClearing(true);
        setError(null);
        try {
            await clearDummyDataApi();
            setResult(null);
        } catch (err) {
            setError(err instanceof Error ? err.message : '더미 데이터 삭제에 실패했습니다.');
        } finally {
            setIsClearing(false);
        }
    };

    return (
        <Card data-testid="dummy-data-section">
            <h3 className="font-semibold text-lg text-[var(--cohi-text-dark)] mb-4">
                개발자 도구
            </h3>
            <p className="text-sm text-[var(--cohi-text-muted)] mb-4">
                테스트용 더미 데이터를 생성하거나 삭제합니다.
            </p>

            <div className="flex gap-3">
                <Button
                    variant="primary"
                    onClick={handleGenerate}
                    disabled={isGenerating || isClearing}
                    data-testid="generate-dummy-data-btn"
                >
                    {isGenerating ? '생성 중...' : '더미 데이터 생성'}
                </Button>
                <Button
                    variant="outline"
                    onClick={handleClear}
                    disabled={isGenerating || isClearing}
                    data-testid="clear-dummy-data-btn"
                >
                    {isClearing ? '삭제 중...' : '더미 데이터 삭제'}
                </Button>
            </div>

            {error && (
                <div
                    className="mt-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm"
                    data-testid="dummy-data-error"
                >
                    {error}
                </div>
            )}

            {result && (
                <div
                    className="mt-4 p-3 bg-green-50 text-green-700 rounded-lg text-sm"
                    data-testid="dummy-data-result"
                >
                    <p>더미 데이터가 생성되었습니다:</p>
                    <ul className="list-disc list-inside mt-1">
                        <li>게스트: {result.membersCreated}명</li>
                        <li>호스트: {result.hostsCreated}명</li>
                        <li>타임슬롯: {result.timeSlotsCreated}개</li>
                        <li>예약: {result.bookingsCreated}건</li>
                    </ul>
                </div>
            )}
        </Card>
    );
}
