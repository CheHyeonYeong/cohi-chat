import { Link, useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import Button from '~/components/button/Button';
import LinkButton from '~/components/button/LinkButton';
import { Header } from '~/components/header';
import { useHosts } from '~/hooks/useHost';
import { LogoutButton } from '~/components/button/LogoutButton';
import { useAuth } from '~/features/member';
import { useMyCalendar } from '~/features/host';

function HostCard({
    displayName,
    username,
    job,
    chatCount,
    profileImageUrl,
}: {
    displayName: string;
    username: string;
    job?: string;
    chatCount: number;
    profileImageUrl?: string;
}) {
    const now = new Date();
    const [imgError, setImgError] = useState(false);

    // XSS 방지를 위한 URL 프로토콜 체크
    const isSafeUrl = (url?: string) => {
        if (!url) return false;
        const lowerUrl = url.toLowerCase().trim();
        return lowerUrl.startsWith('http://') || lowerUrl.startsWith('https://');
    };

    return (
        <Link
            to='/calendar/$slug'
            params={{ slug: username }}
            search={{ year: now.getFullYear(), month: now.getMonth() + 1 }}
            className='flex items-center gap-3 bg-white rounded-2xl px-6 py-4 shadow-md hover:shadow-lg transition-shadow cursor-pointer'
        >
            <div className='w-12 h-12 rounded-full bg-[var(--cohe-bg-warm)] flex items-center justify-center overflow-hidden flex-shrink-0'>
                {isSafeUrl(profileImageUrl) && !imgError ? (
                    <img
                        src={profileImageUrl}
                        alt={displayName}
                        className='w-full h-full object-cover'
                        onError={() => setImgError(true)}
                    />
                ) : (
                    <span className='text-lg font-semibold text-[var(--cohi-primary)]'>
                        {displayName.charAt(0)}
                    </span>
                )}
            </div>
            <div className='flex flex-col min-w-0'>
                <span className='font-semibold text-[var(--cohe-text-dark)] truncate'>{displayName}</span>
                <span className='text-sm text-gray-500 truncate'>{job ?? '호스트'}</span>
                {chatCount > 0 && (
                    <span className='text-xs text-[var(--cohi-primary)]'>커피챗 {chatCount}회</span>
                )}
            </div>
        </Link>
    );
}

export default function Home() {
    const hosts = useHosts();
    const { isAuthenticated, data: user } = useAuth();
    const navigate = useNavigate();
    const isHost = isAuthenticated && user?.isHost;
    const { data: myCalendar, isLoading: isCalendarLoading } = useMyCalendar(!!isHost);

    const handleFindHosts = () => {
        if (isAuthenticated) {
            document.getElementById('host-list')?.scrollIntoView({ behavior: 'smooth' });
        } else {
            navigate({ to: '/login' });
        }
    };

    return (
        <div className='w-full min-h-screen bg-[var(--cohi-bg-light)]'>
            {/* Header */}
            <Header right={
                <div className='flex items-center gap-3'>
                    {isAuthenticated && !isCalendarLoading && (
                        isHost && myCalendar ? (
                            <LinkButton variant="primary" to='/host/timeslots'>
                                호스트 대시보드
                            </LinkButton>
                        ) : (
                            <LinkButton variant="outline" to='/host/register'>
                                호스트 등록하기
                            </LinkButton>
                        )
                    )}
                    {isAuthenticated
                        ? <LogoutButton />
                        : <LinkButton variant="outline" to='/login'>
                            로그인
                        </LinkButton>
                    }
                </div>
            } />

            {/* Hero Section */}
            <section className='w-full cohi-bg-gradient relative overflow-hidden'>
                <div className='w-full px-6 py-16 md:py-24'>
                    <div className='text-center space-y-6'>
                        <h1 className='text-3xl md:text-4xl lg:text-5xl font-bold text-[var(--cohi-text-dark)] leading-tight'>
                            부담 없는 대화로 진짜 정보를
                        </h1>
                        <p className='text-lg md:text-xl text-[var(--cohe-text-dark)]/80'>
                            현직자·채용담당자와 1:1 커피챗
                        </p>

                        {/* Tags */}
                        <div className='flex justify-center gap-2 flex-wrap'>
                            <span className='px-4 py-1.5 bg-[var(--cohi-primary)]/10 text-[var(--cohi-primary)] rounded-full text-sm font-medium'>
                                이직 · 커리어 · 네트워킹
                            </span>
                        </div>

                        {/* CTA Button */}
                        <div className='pt-4'>
                            <Button
                                variant="primary"
                                size="lg"
                                onClick={handleFindHosts}
                                className="rounded-full px-8 shadow-lg hover:shadow-xl transition-all"
                            >
                                호스트 찾아보기
                            </Button>
                        </div>
                    </div>

                    {/* Hero Illustration - Abstract Coffee Meeting */}
                    <div className='mt-12 flex justify-center'>
                        <div className='relative w-full max-w-2xl h-48 md:h-64'>
                            {/* Left Person */}
                            <div className='absolute left-1/4 bottom-0 w-20 h-32 md:w-24 md:h-40'>
                                <div className='w-12 h-12 md:w-14 md:h-14 rounded-full bg-[var(--cohi-secondary)] mx-auto' />
                                <div className='w-16 h-20 md:w-20 md:h-24 bg-[var(--cohi-secondary)]/70 rounded-t-3xl mt-2 mx-auto' />
                            </div>

                            {/* Coffee Table */}
                            <div className='absolute left-1/2 bottom-8 transform -translate-x-1/2'>
                                <div className='w-24 h-2 md:w-32 md:h-3 bg-[var(--cohi-primary)] rounded-full' />
                                <div className='w-16 h-8 md:w-20 md:h-10 bg-[var(--cohi-primary)]/80 mx-auto rounded-b-lg' />
                            </div>

                            {/* Right Person */}
                            <div className='absolute right-1/4 bottom-0 w-20 h-32 md:w-24 md:h-40'>
                                <div className='w-12 h-12 md:w-14 md:h-14 rounded-full bg-[var(--cohi-primary)]/60 mx-auto' />
                                <div className='w-16 h-20 md:w-20 md:h-24 bg-[var(--cohi-primary)]/40 rounded-t-3xl mt-2 mx-auto' />
                            </div>

                            {/* Decorative Plants */}
                            <div className='absolute left-0 bottom-0 w-8 h-16 md:w-10 md:h-20 bg-green-600/40 rounded-t-full' />
                            <div className='absolute right-0 bottom-0 w-8 h-20 md:w-10 md:h-24 bg-green-600/50 rounded-t-full' />
                        </div>
                    </div>
                </div>
            </section>

            {/* Host List Section */}
            <section id='host-list' className='w-full py-12 md:py-16 px-6'>
                <div className='w-full max-w-7xl mx-auto'>
                    <h2 className='text-2xl md:text-3xl font-bold text-[var(--cohi-text-dark)] mb-8'>
                        호스트 목록
                    </h2>

                    {hosts.isLoading && (
                        <div className='text-center py-8 text-gray-500'>
                            읽어오는 중...
                        </div>
                    )}

                    {hosts.error && (
                        <div className='text-center py-8'>
                            <p className='text-red-500'>{hosts.error.message}</p>
                        </div>
                    )}

                    {hosts.data && hosts.data.length > 0 && (
                        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
                            {hosts.data.map((host) => (
                                <HostCard
                                    key={host.username}
                                    displayName={host.displayName}
                                    username={host.username}
                                    job={host.job}
                                    chatCount={host.chatCount}
                                    profileImageUrl={host.profileImageUrl}
                                />
                            ))}
                        </div>
                    )}

                    {hosts.data && hosts.data.length === 0 && (
                        <div className='text-center py-8 text-gray-500'>
                            등록된 호스트가 없습니다.
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
};
