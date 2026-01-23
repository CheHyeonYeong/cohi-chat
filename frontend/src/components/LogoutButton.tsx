import { useLogout } from '~/hooks/useLogout';

export default function LogoutButton() {
    const logoutMutation = useLogout();

    return (
        <button
            onClick={() => logoutMutation.mutate()}
            disabled={logoutMutation.isPending}
            className='bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600 disabled:opacity-50'
        >
            {logoutMutation.isPending ? '로그아웃 중...' : '로그아웃'}
        </button>
    );
}
