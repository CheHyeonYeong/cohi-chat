export function useLogout() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const logout = () => {

    localStorage.removeItem('auth_token');
    localStorage.removeItem('username');

    queryClient.clear();
    window.dispatchEvent(new Event('auth-change'));

    navigate({ to: '/app/login' });

    const accessToken = localStorage.getItem('auth_token');
    if (!accessToken) return;

    void fetch(`${API_URL}/members/v1/logout`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }).catch(() => {

    });
  };

  return { logout };
}
