import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CURRENT_USER_QUERY_KEY } from "Components/Auth/AuthContext";
import type { IUser } from "Components/Auth/types";
import { apiClient } from "Data/Api/Client";

export function useUpdateProfileMutation() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (details: { name: string; email: string; currentPassword: string }) =>
			apiClient.patch<IUser>("/account/profile", {
				name: details.name,
				email: details.email,
				current_password: details.currentPassword || null,
			}),
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
	current_password: "currentPassword",
	password_confirmation: "passwordConfirmation",
};
