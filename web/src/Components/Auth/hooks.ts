import { useMutation } from "@tanstack/react-query";
import { apiClient } from "Data/Api/Client";

type IMessageResponse = { message: string };

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
