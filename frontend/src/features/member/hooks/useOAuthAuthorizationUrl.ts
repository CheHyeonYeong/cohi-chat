import { useMutation, UseMutationResult } from '@tanstack/react-query';
import { getOAuthAuthorizationUrlApi } from '../api/oAuthApi';

export function useOAuthAuthorizationUrl(): UseMutationResult<string, Error, string> {
    return useMutation<string, Error, string>({
        mutationFn: (provider: string) => getOAuthAuthorizationUrlApi(provider),
    });
}