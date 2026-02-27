import { Header } from '~/components/header';
import { ProfileEditForm } from '~/features/member/components/ProfileEditForm';
import { PasswordChangeForm } from '~/features/member/components/PasswordChangeForm';
import { LogoutButton } from '~/components/button/LogoutButton';

export default function Settings() {
    return (
        <div className="w-full min-h-screen bg-[var(--cohe-bg-light)]">
            <Header right={<LogoutButton />} />

            <div className="w-full max-w-md mx-auto px-6 py-8">
                <h2 className="text-2xl font-bold text-[var(--cohe-text-dark)] mb-8" data-testid="settings-title">
                    설정
                </h2>

                <div className="flex flex-col gap-8">
                    <div className="bg-white rounded-2xl shadow-md p-8">
                        <ProfileEditForm />
                    </div>

                    <div className="bg-white rounded-2xl shadow-md p-8">
                        <PasswordChangeForm />
                    </div>
                </div>
            </div>
        </div>
    );
}
