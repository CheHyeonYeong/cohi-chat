import { Link } from '@tanstack/react-router';

export default function Footer() {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="w-full bg-[var(--cohe-bg-warm)] border-t border-gray-200">
            <div className="max-w-7xl mx-auto px-6 py-8">
                <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                    {/* Copyright */}
                    <div className="text-sm text-gray-600">
                        Copyright &copy; {currentYear} coheChat
                    </div>

                    {/* Service Links */}
                    <nav className="flex gap-6">
                        <Link
                            to="/app"
                            className="text-sm text-gray-600 hover:text-[var(--cohe-primary)] transition-colors"
                        >
                            이용약관
                        </Link>
                        <Link
                            to="/app"
                            className="text-sm text-gray-600 hover:text-[var(--cohe-primary)] transition-colors"
                        >
                            개인정보처리방침
                        </Link>
                    </nav>
                </div>
            </div>
        </footer>
    );
}
