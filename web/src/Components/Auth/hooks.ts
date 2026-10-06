import { useMutation } from "@tanstack/react-query";
import { apiClient } from "Data/Api/Client";

type IMessageResponse = { message: string };

/** Maps the API's snake_case field names to the sign-in forms' fields, for apiFieldErrors(). */
export const AUTH_FIELD_NAMES = {
	first_name: "firstName",
	last_name: "lastName",
	password_confirmation: "passwordConfirmation",
};

type IResetPasswordPayload = {
	token: string;
	email: string;
	password: string;
	passwordConfirmation: string;
};

export function useForgotPasswordMutation() {
	return useMutation({
		mutationFn: (details: { email: string }) => apiClient.post<IMessageResponse>("/auth/forgot-password", details),
	});
}

export function useResetPasswordMutation() {
	return useMutation({
		mutationFn: (details: IResetPasswordPayload) =>
			apiClient.post<IMessageResponse>("/auth/reset-password", {
				token: details.token,
				email: details.email,
				password: details.password,
				password_confirmation: details.passwordConfirmation,
			}),
	});
}
