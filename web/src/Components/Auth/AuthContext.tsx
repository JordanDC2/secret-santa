import { createContext, useCallback, useContext, useMemo, type PropsWithChildren } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { UseMutationResult } from "@tanstack/react-query";
import type { IUser } from "Components/Auth/types";
import { apiClient } from "Data/Api/Client";

const CURRENT_USER_QUERY_KEY = ["auth", "user"];

type ILoginPayload = { email: string; password: string };
type IRegisterPayload = { name: string; email: string; password: string; passwordConfirmation: string };

type IAuthContext = {
	user: IUser | null;
	status: "loading" | "authenticated" | "unauthenticated";
	login: UseMutationResult<IUser, Error, ILoginPayload>;
	register: UseMutationResult<IUser, Error, IRegisterPayload>;
	logout: () => void;
};

const AuthContext = createContext<IAuthContext | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
	const queryClient = useQueryClient();
	const currentUserQuery = useQuery({
		queryKey: CURRENT_USER_QUERY_KEY,
		queryFn: () => apiClient.get<IUser>("/user"),
		retry: false,
	});

	const loginMutation = useMutation({
		mutationFn: (credentials: ILoginPayload) => apiClient.post<IUser>("/auth/login", credentials),
		onSuccess: (user) => queryClient.setQueryData(CURRENT_USER_QUERY_KEY, user),
	});

	const registerMutation = useMutation({
		mutationFn: (details: IRegisterPayload) =>
			apiClient.post<IUser>("/auth/register", {
				name: details.name,
				email: details.email,
				password: details.password,
				password_confirmation: details.passwordConfirmation,
			}),
		onSuccess: (user) => queryClient.setQueryData(CURRENT_USER_QUERY_KEY, user),
	});

	const logoutMutation = useMutation({
		mutationFn: () => apiClient.post<void>("/auth/logout"),
		onSuccess: () => {
			queryClient.setQueryData(CURRENT_USER_QUERY_KEY, null);
			queryClient.clear();
		},
	});

	const status: IAuthContext["status"] = currentUserQuery.isPending
		? "loading"
		: currentUserQuery.data
			? "authenticated"
			: "unauthenticated";

	const logout = useCallback(() => logoutMutation.mutate(), [logoutMutation]);

	const value: IAuthContext = useMemo(
		() => ({
			user: currentUserQuery.data ?? null,
			status,
			login: loginMutation,
			register: registerMutation,
			logout,
		}),
		[currentUserQuery.data, status, loginMutation, registerMutation, logout],
	);

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
	const context = useContext(AuthContext);

	if (!context) {
		throw new Error("useAuth must be used within an AuthProvider.");
	}

	return context;
}
