import { PageLayout } from '~/components';
import { PasswordChangeForm } from '~/features/member/components/PasswordChangeForm';

export const Settings = () => <PageLayout title="회원정보 변경" maxWidth="md">
    <div className="flex flex-col gap-8">
        <div className="bg-white rounded-2xl shadow-md p-8">
            <PasswordChangeForm />
        </div>
    </div>
</PageLayout>;
