import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { IManagedKind, IManagedProfile } from "Components/ManagedProfiles/types";
import { apiClient } from "Data/Api/Client";

export const MANAGED_PROFILES_QUERY_KEY = ["account", "profiles"];

export function useManagedProfilesQuery() {
	return useQuery({
		queryKey: MANAGED_PROFILES_QUERY_KEY,
		queryFn: () => apiClient.get<IManagedProfile[]>("/account/profiles"),
	});
}

/** Adds a kid or pet, or (given an id) renames one. */
export function useSaveManagedProfileMutation() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({ id, name, kind }: { id?: number; name: string; kind: IManagedKind }) =>
			id
				? apiClient.patch<IManagedProfile>(`/account/profiles/${id}`, { name, kind })
				: apiClient.post<IManagedProfile>("/account/profiles", { name, kind }),
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
