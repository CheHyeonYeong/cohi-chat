import { useState, useEffect } from 'react';
import Button from '~/components/button/Button';
import { Card } from '~/components/card';
import { getServiceAccountEmail } from '~/features/host/api/hostCalendarApi';
import { CALENDAR_ID_REGEX } from '~/features/host/utils/validation';
import calendarSettingsGuide from '~/assets/images/host-register/calendar-settings-guide.png';
import calendarShareGuide from '~/assets/images/host-register/calendar-share-guide.png';

export interface GoogleCalendarSetupData {
    googleCalendarId: string;
}

interface GoogleCalendarSetupProps {
    data: GoogleCalendarSetupData;
    onChange: (data: GoogleCalendarSetupData) => void;
    errors: Record<string, string>;
    noShadow?: boolean;
}

export function CalendarIcon({ className = '' }: { className?: string }) {
    return (
        <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2" />
            <path d="M3 10H21" stroke="currentColor" strokeWidth="2" />
            <path d="M8 2V6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <path d="M16 2V6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <text x="12" y="18" textAnchor="middle" fill="currentColor" fontSize="7" fontWeight="bold">21</text>
        </svg>
    );
}

function ExternalLinkIcon({ className = '' }: { className?: string }) {
    return (
        <svg className={className} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M6 3H3V13H13V10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M9 2H14V7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M14 2L7 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
    );
}

function CopyIcon({ className = '' }: { className?: string }) {
    return (
        <svg className={className} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="5" y="5" width="9" height="9" rx="1" stroke="currentColor" strokeWidth="1.5" />
            <path d="M3 11V3C3 2.44772 3.44772 2 4 2H12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
    );
}

function CheckIcon({ className = '' }: { className?: string }) {
    return (
        <svg className={className} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M3 8L6.5 11.5L13 4.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}

export default function GoogleCalendarSetup({ data, onChange, errors, noShadow }: GoogleCalendarSetupProps) {
    const [copied, setCopied] = useState(false);
    const [confirmed, setConfirmed] = useState(false);
    const [serviceAccountEmail, setServiceAccountEmail] = useState<string>('');
    const [emailError, setEmailError] = useState(false);
    const [emailCopied, setEmailCopied] = useState(false);
    const isValid = CALENDAR_ID_REGEX.test(data.googleCalendarId);
    const hasInput = data.googleCalendarId.length > 0;

    useEffect(() => {
        getServiceAccountEmail()
            .then(({ serviceAccountEmail: email }) => setServiceAccountEmail(email))
            .catch(() => setEmailError(true));
    }, []);

    const handleCopyEmail = async () => {
        if (!serviceAccountEmail) return;
        try {
            await navigator.clipboard.writeText(serviceAccountEmail);
            setEmailCopied(true);
            setTimeout(() => setEmailCopied(false), 2000);
        } catch {
            // clipboard API 미지원 시 무시
        }
    };

    const handlePaste = async () => {
        try {
            const text = await navigator.clipboard.readText();
            onChange({ googleCalendarId: text.trim() });
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            // clipboard API 미지원 시 무시
        }
    };

    return (
        <div className="flex flex-col lg:flex-row gap-8">
            {/* Left: Instruction cards */}
            <div className="flex-1 space-y-4">
                {/* Step 1 — Google Calendar 접속 */}
                <Card size="sm" noShadow={noShadow}>
                    <div className="flex items-start gap-4">
                        <div className="flex-shrink-0">
                            <span className="w-7 h-7 rounded-full bg-[var(--cohi-primary)] text-white text-sm font-bold flex items-center justify-center">
                                1
                            </span>
                        </div>
                        <div className="flex-1">
                            <p className="text-xs text-gray-500 mb-1">1단계</p>
                            <h3 className="font-bold text-[var(--cohi-text-dark)] mb-3">
                                Google Calendar 접속
                            </h3>
                            <a
                                href="https://calendar.google.com"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[var(--cohi-bg-light)] text-[var(--cohi-primary)] text-sm font-medium hover:bg-[var(--cohi-bg-warm)] transition-colors"
                            >
                                calendar.google.com 열기
                                <ExternalLinkIcon className="w-3.5 h-3.5" />
                            </a>
                            <p className="mt-3 text-sm text-gray-600 leading-relaxed">
                                웹 브라우저에서 Google Calendar를 열어주세요.
                                아직 로그인하지 않았다면 Google 계정으로 로그인해주세요.
                            </p>
                        </div>
                    </div>
                </Card>

                {/* Step 2 — 서비스 어카운트 공유 설정 */}
                <Card size="sm" noShadow={noShadow}>
                    <div className="flex items-start gap-4">
                        <div className="flex-shrink-0">
                            <span className="w-7 h-7 rounded-full bg-[var(--cohi-primary)] text-white text-sm font-bold flex items-center justify-center">
                                2
                            </span>
                        </div>
                        <div className="flex-1">
                            <p className="text-xs text-gray-500 mb-1">2단계</p>
                            <h3 className="font-bold text-[var(--cohi-text-dark)] mb-3">
                                서비스 어카운트를 캘린더 편집자로 공유
                            </h3>
                            <p className="text-sm text-gray-600 mb-3 leading-relaxed">
                                cohiChat이 캘린더에 예약을 등록하려면, 아래 이메일을 캘린더 편집자로 추가해야 합니다.
                            </p>
                            <div className="flex items-center gap-2 bg-[var(--cohi-bg-light)] rounded-lg px-3 py-2 mb-3">
                                <span className="flex-1 text-sm font-mono text-[var(--cohi-text-dark)] break-all select-all">
                                    {emailError ? '이메일을 불러올 수 없습니다' : serviceAccountEmail || '설정 중...'}
                                </span>
                                <button
                                    type="button"
                                    onClick={handleCopyEmail}
                                    disabled={!serviceAccountEmail}
                                    className="flex-shrink-0 text-gray-400 hover:text-[var(--cohi-primary)] transition-colors disabled:opacity-40"
                                    title="이메일 복사"
                                >
                                    {emailCopied ? (
                                        <CheckIcon className="w-4 h-4 text-green-500" />
                                    ) : (
                                        <CopyIcon className="w-4 h-4" />
                                    )}
                                </button>
                            </div>
                            <ol className="text-sm text-gray-600 space-y-1 list-decimal list-inside mb-4">
                                <li>Google Calendar 설정 &gt; <strong>특정 사용자와 공유</strong></li>
                                <li>위 이메일 주소 입력 후 추가</li>
                                <li>권한을 <strong>변경 및 공유 관리</strong>로 설정</li>
                            </ol>
                            {/* 이미지 가이드 */}
                            <div className="space-y-4">
                                <div className="bg-[var(--cohi-bg-warm)]/50 rounded-xl overflow-hidden">
                                    <img
                                        src={calendarSettingsGuide}
                                        alt="캘린더 설정 열기"
                                        className="w-full h-auto"
                                    />
                                    <p className="text-sm text-gray-600 text-center py-2">설정 및 공유 열기</p>
                                </div>
                                <div className="bg-[var(--cohi-bg-warm)]/50 rounded-xl overflow-hidden">
                                    <img
                                        src={calendarShareGuide}
                                        alt="사용자 추가"
                                        className="w-full h-auto"
                                    />
                                    <p className="text-sm text-gray-600 text-center py-2">특정 사용자와 공유 (변경 및 공유 관리 권한)</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Right: Calendar ID input */}
            <div className="w-full lg:w-80 flex-shrink-0">
                <Card noShadow={noShadow}>
                    <div className="flex items-center gap-2 mb-4">
                        <span className="w-7 h-7 rounded-full bg-[var(--cohi-primary)] text-white text-sm font-bold flex items-center justify-center">
                            3
                        </span>
                        <div>
                            <p className="text-xs text-gray-500">3단계</p>
                            <h3 className="font-bold text-[var(--cohi-text-dark)]">Calendar ID 입력</h3>
                        </div>
                    </div>

                    <div className="relative mb-2">
                        <input
                            type="text"
                            value={data.googleCalendarId}
                            onChange={(e) => { setConfirmed(false); onChange({ googleCalendarId: e.target.value.trim() }); }}
                            placeholder="your-email@gmail.com"
                            className={`w-full px-4 py-3 pr-16 rounded-lg border bg-white text-[var(--cohi-text-dark)] placeholder-gray-400 focus:outline-none focus:ring-1 ${
                                hasInput && isValid
                                    ? 'border-green-400 focus:border-green-400 focus:ring-green-400'
                                    : hasInput && !isValid
                                        ? 'border-red-300 focus:border-red-300 focus:ring-red-300'
                                        : 'border-gray-300 focus:border-[var(--cohi-primary)] focus:ring-[var(--cohi-primary)]'
                            }`}
                        />
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                            <button
                                type="button"
                                onClick={handlePaste}
                                className="text-gray-400 hover:text-[var(--cohi-primary)] transition-colors"
                                title="붙여넣기"
                            >
                                {copied ? (
                                    <CheckIcon className="w-4 h-4 text-green-500" />
                                ) : (
                                    <CopyIcon className="w-4 h-4" />
                                )}
                            </button>
                            {hasInput && isValid && (
                                <CheckIcon className="w-5 h-5 text-green-500" />
                            )}
                        </div>
                    </div>

                    <p className="text-sm text-gray-500 mb-5">
                        로그인한 Google 계정의 Gmail 주소를 입력하세요.
                    </p>

                    {errors.googleCalendarId && (
                        <p className="text-sm text-red-500 mb-4">{errors.googleCalendarId}</p>
                    )}

                    {confirmed && isValid ? (
                        <div className="w-full py-3 rounded-lg bg-green-50 text-green-600 font-semibold text-center">
                            ✓ 형식이 확인되었습니다
                        </div>
                    ) : (
                        <Button
                            variant="primary"
                            size="lg"
                            onClick={() => {
                                if (isValid) setConfirmed(true);
                            }}
                            disabled={!hasInput || !isValid}
                            className="w-full rounded-lg"
                        >
                            연동 확인
                        </Button>
                    )}

                </Card>
            </div>
        </div>
    );
}
