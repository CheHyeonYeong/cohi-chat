import { Link } from '@tanstack/react-router';

export default function Privacy() {
    return (
        <div className="min-h-screen bg-white">
            <div className="max-w-4xl mx-auto px-6 py-16">
                <Link
                    to="/"
                    className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-8 transition-colors"
                >
                    <span>&larr;</span>
                    <span>홈으로 돌아가기</span>
                </Link>
                <h1 className="text-3xl font-bold text-gray-900 mb-8">개인정보처리방침</h1>

                <div className="prose prose-gray max-w-none space-y-8">
                    <section>
                        <h2 className="text-xl font-semibold text-gray-800 mb-4">1. 수집하는 개인정보</h2>
                        <p className="text-gray-600 leading-relaxed mb-4">
                            cohiChat은 서비스 제공을 위해 다음과 같은 개인정보를 수집합니다.
                        </p>
                        <ul className="list-disc list-inside text-gray-600 space-y-2">
                            <li>필수항목: 이메일 주소, 이름</li>
                            <li>선택항목: 프로필 이미지</li>
                            <li>자동수집: 서비스 이용 기록, 접속 로그</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-gray-800 mb-4">2. 개인정보의 이용 목적</h2>
                        <ul className="list-disc list-inside text-gray-600 space-y-2">
                            <li>회원 식별 및 서비스 제공</li>
                            <li>미팅 예약 및 일정 관리</li>
                            <li>Google Calendar 연동</li>
                            <li>서비스 개선 및 통계 분석</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-gray-800 mb-4">3. 개인정보의 보관 및 파기</h2>
                        <p className="text-gray-600 leading-relaxed">
                            회원 탈퇴 시 개인정보는 즉시 파기됩니다.
                            단, 관련 법령에 따라 보관이 필요한 경우 해당 기간 동안 보관 후 파기합니다.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-gray-800 mb-4">4. 개인정보의 제3자 제공</h2>
                        <p className="text-gray-600 leading-relaxed">
                            cohiChat은 원칙적으로 회원의 개인정보를 제3자에게 제공하지 않습니다.
                            다만, 회원의 동의가 있거나 법령에 의한 경우에는 예외로 합니다.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-gray-800 mb-4">5. 이용자의 권리</h2>
                        <ul className="list-disc list-inside text-gray-600 space-y-2">
                            <li>개인정보 열람, 정정, 삭제 요청</li>
                            <li>개인정보 처리 정지 요청</li>
                            <li>회원 탈퇴</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-gray-800 mb-4">6. 개인정보 보호책임자</h2>
                        <p className="text-gray-600 leading-relaxed">
                            개인정보 처리에 관한 문의사항은 아래 연락처로 문의해 주시기 바랍니다.
                        </p>
                        <p className="text-gray-600 mt-2">
                            이메일: support@cohichat.com
                        </p>
                    </section>

                    <div className="pt-8 border-t border-gray-200">
                        <p className="text-sm text-gray-500">
                            시행일: 2026년 1월 1일
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
