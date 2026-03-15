import { PageLayout } from '~/components';
import { ProfileEditForm } from '~/features/member/components/ProfileEditForm';
import { PasswordChangeForm } from '~/features/member/components/PasswordChangeForm';

export function Settings() {
    return (
        <PageLayout title="회원정보 변경" maxWidth="md">
            <div className="flex flex-col gap-8">
                <div className="bg-white rounded-2xl shadow-md p-8">
                    <ProfileEditForm />
                </div>

                <div className="bg-white rounded-2xl shadow-md p-8">
                    <PasswordChangeForm />
                </div>
            </div>
        </PageLayout>
    );
}
