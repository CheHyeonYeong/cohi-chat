import { Link } from '@tanstack/react-router';
import { useHosts } from '~/hooks/useHost';
import { LogoutButton } from '~/components/button/LogoutButton';

export default function Home() {
    const hosts = useHosts();
    const now = new Date();
    const isLoggedIn = !!localStorage.getItem('auth_token');

    return (
        <div className='w-6/12 mx-auto flex flex-col justify-center min-h-[200px] px-8 space-y-4'>
            <div className='flex justify-between items-center'>
                <h1 className='text-2xl font-bold'>약속 잡기 서비스</h1>
                <div className='flex gap-2'>
                    {isLoggedIn && <Link to='/app/my-bookings' className='border border-gray-500 hover:border-gray-300 px-4 py-2 rounded-md'>내 예약</Link>}
                    {isLoggedIn ? <LogoutButton /> : <Link to='/app/login' className='bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700'>로그인</Link>}
                </div>
            </div>

            {hosts.isLoading && <div data-testid="loading">읽어오는 중...</div>}
            {hosts.error && <div className='space-y-2'>
                <p className='text-red-500'>{hosts.error.message}</p>
            </div>}

            <ul data-testid="hosts-list" className='space-y-2'>
                {hosts.data?.map((host) => (
                    <li key={host.username}>
                        <Link
                            to='/app/calendar/$slug'
                            params={{ slug: host.username }}
                            search={{ year: now.getFullYear(), month: now.getMonth() + 1 }}
                            className='block text-center bg-primary text-white px-4 py-2 rounded-md hover:bg-secondary hover:text-white'
                        >
                            {host.displayName} ({host.username})
                        </Link>
                    </li>
                ))}
            </ul>
        </div>
    );
}

