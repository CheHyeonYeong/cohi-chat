import { useState, useCallback } from 'react';
import { cn } from '~/libs/cn';
import { Card } from '~/components/card';
import { Button } from '~/components/button';
import { useIsSelf } from '~/contexts/IsSelfContext';
import { useUpdateProfile } from '~/features/member/hooks/useUpdateProfile';
import { getErrorMessage } from '~/libs/errorUtils';
import { EditableAvatar } from './EditableAvatar';
import { EditableJob } from './EditableJob';
import type { HostResponseDTO } from '../types';

interface HostProfileCardProps {
    host: HostResponseDTO;
    className?: string;
}

export const HostProfileCard = ({ host, className }: HostProfileCardProps) => {
    const isSelf = useIsSelf();
    const [isEditing, setIsEditing] = useState(false);
    const [editJob, setEditJob] = useState(host.job ?? '');
    const updateProfileMutation = useUpdateProfile();

    const handleEdit = useCallback(() => {
        setEditJob(host.job ?? '');
        setIsEditing(true);
    }, [host.job]);

    const handleCancel = useCallback(() => {
        setIsEditing(false);
        setEditJob(host.job ?? '');
    }, [host.job]);

    const handleSave = useCallback(() => {
        updateProfileMutation.mutate(
            { job: editJob || undefined },
            {
                onSuccess: () => setIsEditing(false),
            },
        );
    }, [editJob, updateProfileMutation]);

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

            <h1
                data-testid="host-profile-name"
                className="mt-4 text-2xl font-bold text-cohi-text-dark"
            >
                {host.displayName}
            </h1>

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
                <div className="mt-4 flex gap-2" data-testid="profile-edit-actions">
                    <Button
                        variant="primary"
                        onClick={handleSave}
                        loading={updateProfileMutation.isPending}
                    >
                        저장
                    </Button>
                    <Button variant="outline" onClick={handleCancel}>
                        취소
                    </Button>
                    {updateProfileMutation.isError && (
                        <p className="text-red-600 text-xs" data-testid="profile-save-error">
                            {getErrorMessage(updateProfileMutation.error)}
                        </p>
                    )}
                </div>
            )}
        </Card>
    );
};
