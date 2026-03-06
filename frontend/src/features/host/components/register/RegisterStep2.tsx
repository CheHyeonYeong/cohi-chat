import GoogleCalendarSetup, { CalendarIcon } from '../GoogleCalendarSetup';

export interface Step2Data {
    googleCalendarId: string;
}

interface RegisterStep2Props {
    data: Step2Data;
    onChange: (data: Step2Data) => void;
    errors: Record<string, string>;
}

export default function RegisterStep2({ data, onChange, errors }: RegisterStep2Props) {
    return (
        <div className="w-full mx-auto">
            <div className="mb-8">
                <div className="flex items-center gap-2 mb-2">
                    <h2 className="text-2xl md:text-3xl font-bold text-[var(--cohi-text-dark)]">
                        Google Calendar 연동하기
                    </h2>
                    <CalendarIcon className="w-7 h-7 text-[var(--cohi-primary)]" />
                </div>
                <p className="text-[var(--cohi-text-dark)]/70">
                    원활한 예약 관리를 위해 Google 캘린더를 cohiChat과 연동해주세요.
                </p>
            </div>
            <GoogleCalendarSetup data={data} onChange={onChange} errors={errors} />
        </div>
    );
}
