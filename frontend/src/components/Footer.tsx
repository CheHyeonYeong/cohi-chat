import { Link } from '@tanstack/react-router';

export default function Footer() {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="w-full bg-slate-900">
            {/* Main Footer Content */}
            <div className="max-w-7xl mx-auto px-6 py-12">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Brand Section */}
                    <div>
                        <h3 className="text-white font-bold text-lg mb-4">coheChat</h3>
                        <p className="text-gray-400 text-sm leading-relaxed">
                            1:1 미팅 예약을 간편하게.<br />
                            Google Calendar와 연동하여<br />
                            일정을 효율적으로 관리하세요.
                        </p>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h3 className="text-white font-bold text-lg mb-4">바로가기</h3>
                        <nav className="flex flex-col gap-3">
                            <Link
                                to="/app"
                                className="text-gray-400 text-sm hover:text-white transition-colors"
                            >
                                홈
                            </Link>
                            <Link
                                to="/terms"
                                className="text-gray-400 text-sm hover:text-white transition-colors"
                            >
                                이용약관
                            </Link>
                            <Link
                                to="/privacy"
                                className="text-gray-400 text-sm hover:text-white transition-colors"
                            >
                                개인정보처리방침
                            </Link>
                        </nav>
                    </div>

                    {/* Contact */}
                    <div>
                        <h3 className="text-white font-bold text-lg mb-4">Contact</h3>
                        <p className="text-gray-400 text-sm">
                            문의 및 피드백은 언제든 환영합니다.
                        </p>
                    </div>
                </div>
            </div>

            {/* Copyright Bar */}
            <div className="border-t border-slate-700">
                <div className="max-w-7xl mx-auto px-6 py-6">
                    <p className="text-center text-gray-500 text-sm">
                        &copy; {currentYear} coheChat. All rights reserved.
                    </p>
                </div>
            </div>
        </footer>
    );
}
