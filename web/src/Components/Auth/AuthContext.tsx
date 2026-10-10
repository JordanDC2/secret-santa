import { createContext, useCallback, useContext, useEffect, useMemo, type PropsWithChildren } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { UseMutationResult } from "@tanstack/react-query";
import { turnOffPush } from "Components/PushNotifications/devicePush";
import type { IUser, IUserResponse } from "Components/Auth/types";
import { apiClient } from "Data/Api/Client";

export const CURRENT_USER_QUERY_KEY = ["auth", "user"];

type ILoginPayload = { email: string; password: string };
type IRegisterPayload = {
	firstName: string;
	lastName: string;
	email: string;
	password: string;
	passwordConfirmation: string;
};

type IAuthContext = {
	user: IUser | null;
	status: "loading" | "authenticated" | "unauthenticated";
	login: UseMutationResult<IUser, Error, ILoginPayload>;
	register: UseMutationResult<IUser, Error, IRegisterPayload>;
	logout: () => void;
};

const AuthContext = createContext<IAuthContext | null>(null);

export function toUser(user: IUserResponse): IUser {
	return {
		id: user.id,
		firstName: user.first_name,
		lastName: user.last_name,
		fullName: user.full_name,
		email: user.email,
		isAdmin: user.is_admin,
		emailVerified: user.email_verified_at !== null,
	};
}

export function AuthProvider({ children }: PropsWithChildren) {
	const queryClient = useQueryClient();
	const currentUserQuery = useQuery({
		queryKey: CURRENT_USER_QUERY_KEY,
		// Null when signed out (a 200, so signed-out pages don't log a failed request).
		queryFn: async () => {
			const { user } = await apiClient.get<{ user: IUserResponse | null }>("/session");

			return user ? toUser(user) : null;
		},
		retry: false,
	});

	const loginMutation = useMutation({
		mutationFn: async (credentials: ILoginPayload) =>
			toUser(await apiClient.post<IUserResponse>("/auth/login", credentials)),
		onSuccess: (user) => queryClient.setQueryData(CURRENT_USER_QUERY_KEY, user),
	});

	const registerMutation = useMutation({
		mutationFn: async (details: IRegisterPayload) =>
			toUser(
				await apiClient.post<IUserResponse>("/auth/register", {
					first_name: details.firstName,
					last_name: details.lastName,
					email: details.email,
					password: details.password,
					password_confirmation: details.passwordConfirmation,
				}),
			),
		onSuccess: (user) => queryClient.setQueryData(CURRENT_USER_QUERY_KEY, user),
	});

	const logoutMutation = useMutation({
		mutationFn: () => apiClient.post<void>("/auth/logout"),
		// The cleanup effect below clears everything else once the signed-in pages are gone.
		onSuccess: () => queryClient.setQueryData(CURRENT_USER_QUERY_KEY, null),
	});

	// Only the first check counts as loading. A logged-out user has no cached data, so
	// background refetches (e.g. on window focus) report isPending again and would
	// otherwise unmount every page mid-interaction.
	const status: IAuthContext["status"] = !currentUserQuery.isFetched
		? "loading"
		: currentUserQuery.data
			? "authenticated"
			: "unauthenticated";

	// Once nobody is signed in, drop everyone else's cached data. Done here, after the signed-in
	// pages have unmounted, so they don't refetch it (and get 401s) on the way out.
	const userId = currentUserQuery.data?.id ?? null;
	useEffect(() => {
		if (userId === null) {
			queryClient.removeQueries({ predicate: (query) => query.queryKey[0] !== CURRENT_USER_QUERY_KEY[0] });
		}
	}, [userId, queryClient]);

	// Stop pushes to this device first (a shared computer shouldn't keep getting the last
	// person's notifications), but never let that hold up logging out.
	const logout = useCallback(() => {
		turnOffPush()
			.catch(() => {})
			.finally(() => logoutMutation.mutate());
	}, [logoutMutation]);

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
