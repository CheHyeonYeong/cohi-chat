import { useState, useCallback } from 'react';
import { cn } from '~/libs/cn';
import { Card } from '~/components/card';
import { Button } from '~/components/button';
import { useIsSelf } from '~/contexts';
import { useUpdateProfile, useUpdateMember } from '~/features/member';
import type { HostResponseDTO } from '~/features/member';
import { getErrorMessage } from '~/libs/errorUtils';
import { EditableAvatar } from './EditableAvatar';
import { EditableDisplayName } from './EditableDisplayName';
import { EditableJob } from './EditableJob';

interface HostProfileCardProps {
    host: HostResponseDTO;
    className?: string;
}

export const HostProfileCard = ({ host, className }: HostProfileCardProps) => {
    const isSelf = useIsSelf();
    const [isEditing, setIsEditing] = useState(false);
    const [editDisplayName, setEditDisplayName] = useState(host.displayName);
    const [editJob, setEditJob] = useState(host.job ?? '');
    const [saveError, setSaveError] = useState<string | null>(null);
    const updateProfileMutation = useUpdateProfile();
    const updateMemberMutation = useUpdateMember(host.username);

    const isSaving = updateProfileMutation.isPending || updateMemberMutation.isPending;

    const handleEdit = useCallback(() => {
        setEditDisplayName(host.displayName);
        setEditJob(host.job ?? '');
        setSaveError(null);
        setIsEditing(true);
    }, [host.displayName, host.job]);

    const handleCancel = useCallback(() => {
        setIsEditing(false);
        setEditDisplayName(host.displayName);
        setEditJob(host.job ?? '');
        setSaveError(null);
    }, [host.displayName, host.job]);

    const handleSave = useCallback(async () => {
        setSaveError(null);

        const trimmedName = editDisplayName.trim();
        const trimmedJob = editJob.trim() || undefined;
        const displayNameChanged = trimmedName !== host.displayName;
        const jobChanged = trimmedJob !== (host.job || undefined);

        if (!displayNameChanged && !jobChanged) {
            setIsEditing(false);
            return;
        }

        if (displayNameChanged && (trimmedName.length < 2 || trimmedName.length > 20)) {
            setSaveError('닉네임은 2자 이상 20자 이하로 입력해주세요.');
            return;
        }

        try {
            const promises: Promise<unknown>[] = [];
            if (displayNameChanged) {
                promises.push(updateMemberMutation.mutateAsync({ displayName: trimmedName }));
            }
            if (jobChanged) {
                promises.push(updateProfileMutation.mutateAsync({ job: trimmedJob }));
            }
            await Promise.all(promises);
            setIsEditing(false);
        } catch (err) {
            setSaveError(getErrorMessage(err as Error));
        }
    }, [editDisplayName, editJob, host.displayName, host.job, updateMemberMutation, updateProfileMutation]);

    return (
        <Card
            variant="elevated"
            size="lg"
            data-testid="host-profile-card"
            className={cn('relative flex flex-col items-center text-center', className)}
        >
            {isSelf && !isEditing && (
                <button
                    type="button"
                    onClick={handleEdit}
                    className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-600"
                    data-testid="profile-edit-button"
                    aria-label="프로필 편집"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                        <path d="M2.695 14.763l-1.262 3.154a.5.5 0 00.65.65l3.155-1.262a4 4 0 001.343-.885L17.5 5.5a2.121 2.121 0 00-3-3L3.58 13.42a4 4 0 00-.885 1.343z" />
                    </svg>
                </button>
            )}

            <EditableAvatar
                displayName={host.displayName}
                profileImageUrl={host.profileImageUrl}
                isEditing={isEditing}
            />

            <EditableDisplayName
                displayName={host.displayName}
                isEditing={isEditing}
                editValue={editDisplayName}
                onEditValueChange={setEditDisplayName}
            />

            <EditableJob
                job={host.job}
                isEditing={isEditing}
                editValue={editJob}
                onEditValueChange={setEditJob}
            />

            {host.chatCount > 0 && (
                <span
                    data-testid="host-profile-chat-count"
                    className="mt-3 inline-flex items-center px-3 py-1 bg-cohi-primary/10 text-cohi-primary rounded-full text-sm font-medium"
                >
                    커피챗 {host.chatCount}회
                </span>
            )}

            {isEditing && (
                <div className="mt-4 flex flex-col items-center gap-2" data-testid="profile-edit-actions">
                    <div className="flex gap-2">
                        <Button
                            variant="primary"
                            onClick={handleSave}
                            loading={isSaving}
                        >
                            저장
                        </Button>
                        <Button variant="outline" onClick={handleCancel}>
                            취소
                        </Button>
                    </div>
                    {saveError && (
                        <p className="text-red-600 text-xs" data-testid="profile-save-error">
                            {saveError}
                        </p>
                    )}
                </div>
            )}
        </Card>
    );
};
