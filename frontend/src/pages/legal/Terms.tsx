import { Link } from '@tanstack/react-router';

export default function Terms() {
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
                <h1 className="text-3xl font-bold text-gray-900 mb-8">이용약관</h1>

                <div className="prose prose-gray max-w-none space-y-8">
                    <section>
                        <h2 className="text-xl font-semibold text-gray-800 mb-4">제1조 (목적)</h2>
                        <p className="text-gray-600 leading-relaxed">
                            이 약관은 coheChat(이하 "서비스")이 제공하는 1:1 미팅 예약 서비스의 이용조건 및
                            절차에 관한 사항을 규정함을 목적으로 합니다.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-gray-800 mb-4">제2조 (정의)</h2>
                        <ul className="list-disc list-inside text-gray-600 space-y-2">
                            <li>"서비스"란 coheChat이 제공하는 미팅 예약 및 일정 관리 서비스를 말합니다.</li>
                            <li>"회원"이란 서비스에 가입하여 이용하는 자를 말합니다.</li>
                            <li>"호스트"란 미팅 일정을 공개하고 예약을 받는 회원을 말합니다.</li>
                            <li>"게스트"란 호스트의 일정에 예약을 신청하는 회원을 말합니다.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-gray-800 mb-4">제3조 (서비스 이용)</h2>
                        <p className="text-gray-600 leading-relaxed">
                            회원은 서비스를 통해 Google Calendar와 연동하여 미팅 일정을 관리하고,
                            다른 회원과 1:1 미팅을 예약할 수 있습니다.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-gray-800 mb-4">제4조 (회원의 의무)</h2>
                        <ul className="list-disc list-inside text-gray-600 space-y-2">
                            <li>회원은 정확한 정보를 제공해야 합니다.</li>
                            <li>회원은 예약한 미팅에 성실히 참여해야 합니다.</li>
                            <li>회원은 타인의 권리를 침해하는 행위를 해서는 안 됩니다.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-gray-800 mb-4">제5조 (서비스 변경 및 중단)</h2>
                        <p className="text-gray-600 leading-relaxed">
                            서비스는 운영상 필요한 경우 사전 공지 후 서비스 내용을 변경하거나
                            일시적으로 중단할 수 있습니다.
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
