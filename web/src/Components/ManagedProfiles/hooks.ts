import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { GROUPS_QUERY_KEY } from "Components/Groups/hooks";
import type { IManagedKind, IManagedProfile, IManagedProfileResponse } from "Components/ManagedProfiles/types";
import { apiClient } from "Data/Api/Client";

export const MANAGED_PROFILES_QUERY_KEY = ["account", "profiles"];

export function useManagedProfilesQuery() {
	return useQuery({
		queryKey: MANAGED_PROFILES_QUERY_KEY,
		queryFn: async () =>
			(await apiClient.get<IManagedProfileResponse[]>("/account/profiles")).map((profile): IManagedProfile => ({
				id: profile.id,
				firstName: profile.first_name,
				lastName: profile.last_name,
				name: profile.name,
				kind: profile.kind,
				managers: profile.managers,
			})),
	});
}

/** Adds a kid or pet, or (given an id) renames one. */
export function useSaveManagedProfileMutation() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({
			id,
			firstName,
			lastName,
			kind,
		}: {
			id?: number;
			firstName: string;
			lastName: string;
			kind: IManagedKind;
		}) => {
			const body = { first_name: firstName, last_name: lastName || null, kind };

			return id
				? apiClient.patch<IManagedProfileResponse>(`/account/profiles/${id}`, body)
				: apiClient.post<IManagedProfileResponse>("/account/profiles", body);
		},
		onSuccess: () => queryClient.invalidateQueries({ queryKey: MANAGED_PROFILES_QUERY_KEY }),
	});
}

/** Removes a kid or pet and their wishlist. */
export function useDeleteManagedProfileMutation() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (id: number) => apiClient.delete<void>(`/account/profiles/${id}`),
		onSuccess: () => queryClient.invalidateQueries({ queryKey: MANAGED_PROFILES_QUERY_KEY }),
	});
}

/** Shares looking after a kid or pet with someone from your groups, or (remove) stops someone. */
export function useSetCoParentMutation(profileId: number) {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async ({ userId, add }: { userId: number; add: boolean }) => {
			if (add) {
				await apiClient.post<IManagedProfileResponse>(`/account/profiles/${profileId}/managers`, { user_id: userId });
			} else {
				await apiClient.delete<void>(`/account/profiles/${profileId}/managers/${userId}`);
			}
		},
		onSuccess: () => {
			void queryClient.invalidateQueries({ queryKey: MANAGED_PROFILES_QUERY_KEY });
			// Group cards mark which kids are yours.
			void queryClient.invalidateQueries({ queryKey: GROUPS_QUERY_KEY });
		},
	});
}
