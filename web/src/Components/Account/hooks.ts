import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CURRENT_USER_QUERY_KEY, toUser } from "Components/Auth/AuthContext";
import type { IEmailKind, IEmailPreferences } from "Components/Account/types";
import type { IUserResponse } from "Components/Auth/types";
import { apiClient } from "Data/Api/Client";

export function useUpdateProfileMutation() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (details: { firstName: string; lastName: string; email: string; currentPassword: string }) =>
			toUser(
				await apiClient.patch<IUserResponse>("/account/profile", {
					first_name: details.firstName,
					last_name: details.lastName,
					email: details.email,
					current_password: details.currentPassword || null,
				}),
			),
		onSuccess: (user) => queryClient.setQueryData(CURRENT_USER_QUERY_KEY, user),
	});
}

export function useUpdatePasswordMutation() {
	return useMutation({
		mutationFn: (details: { currentPassword: string; password: string; passwordConfirmation: string }) =>
			apiClient.put<void>("/account/password", {
				current_password: details.currentPassword,
				password: details.password,
				password_confirmation: details.passwordConfirmation,
			}),
	});
}

export function useDeleteAccountMutation() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (currentPassword: string) => apiClient.delete<void>("/account", { current_password: currentPassword }),
		onSuccess: () => {
			// Same as logging out: the app falls back to the login page.
			queryClient.setQueryData(CURRENT_USER_QUERY_KEY, null);
			queryClient.clear();
		},
	});
}

/** API field names → form field names, for apiFieldErrors. */
export const ACCOUNT_FIELD_NAMES = {
	first_name: "firstName",
	last_name: "lastName",
	current_password: "currentPassword",
	password_confirmation: "passwordConfirmation",
};

const EMAIL_PREFERENCES_QUERY_KEY = ["account", "email-preferences"];

export function useEmailPreferencesQuery() {
	return useQuery({
		queryKey: EMAIL_PREFERENCES_QUERY_KEY,
		queryFn: () => apiClient.get<IEmailPreferences>("/account/email-preferences"),
	});
}

/** Flips one switch straight away, and flips it back if the save fails. */
export function useUpdateEmailPreferenceMutation() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({ kind, on }: { kind: IEmailKind; on: boolean }) =>
			apiClient.patch<IEmailPreferences>("/account/email-preferences", { [kind]: on }),
		onMutate: async ({ kind, on }) => {
			await queryClient.cancelQueries({ queryKey: EMAIL_PREFERENCES_QUERY_KEY });
			const previous = queryClient.getQueryData<IEmailPreferences>(EMAIL_PREFERENCES_QUERY_KEY);

			if (previous) {
				queryClient.setQueryData<IEmailPreferences>(EMAIL_PREFERENCES_QUERY_KEY, { ...previous, [kind]: on });
			}

			return { previous };
		},
		onError: (_error, _change, context) => {
			if (context?.previous) {
				queryClient.setQueryData(EMAIL_PREFERENCES_QUERY_KEY, context.previous);
			}
		},
		onSuccess: (preferences) => queryClient.setQueryData(EMAIL_PREFERENCES_QUERY_KEY, preferences),
	});
}
