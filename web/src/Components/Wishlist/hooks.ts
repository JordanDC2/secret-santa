import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { IMemberWishlist, IWishlistItem, IWishlistItemDetails } from "Components/Wishlist/types";
import { apiClient } from "Data/Api/Client";

const MY_WISHLIST_QUERY_KEY = ["wishlist", "mine"];
export const memberWishlistQueryKey = (userId: number) => ["wishlist", "member", userId];

function mapItem(raw: Record<string, unknown>): IWishlistItem {
	const claim = raw.claim as Record<string, unknown> | null | undefined;

	return {
		id: raw.id as number,
		name: raw.name as string,
		url: raw.url as string | null,
		price: raw.price === null ? null : Number(raw.price),
		notes: raw.notes as string | null,
		rating: raw.rating as number,
		...(claim !== undefined && {
			claim: claim
				? { claimedByMe: claim.claimed_by_me as boolean, claimedByName: claim.claimed_by_name as string }
				: null,
		}),
	};
}

export function useMyWishlistQuery() {
	return useQuery({
		queryKey: MY_WISHLIST_QUERY_KEY,
		queryFn: async () => {
			const items = await apiClient.get<Record<string, unknown>[]>("/wishlist/items");

			return items.map(mapItem);
		},
	});
}

export function useSaveWishlistItemMutation() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async ({ id, details }: { id?: number; details: IWishlistItemDetails }) => {
			const item = id
				? await apiClient.patch<Record<string, unknown>>(`/wishlist/items/${id}`, details)
				: await apiClient.post<Record<string, unknown>>("/wishlist/items", details);

			return mapItem(item);
		},
		onSuccess: () => queryClient.invalidateQueries({ queryKey: MY_WISHLIST_QUERY_KEY }),
	});
}

export function useDeleteWishlistItemMutation() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (id: number) => apiClient.delete<void>(`/wishlist/items/${id}`),
		onSuccess: () => queryClient.invalidateQueries({ queryKey: MY_WISHLIST_QUERY_KEY }),
	});
}

export function useMemberWishlistQuery(userId: number) {
	return useQuery({
		queryKey: memberWishlistQueryKey(userId),
		queryFn: async (): Promise<IMemberWishlist> => {
			const wishlist = await apiClient.get<{
				user: IMemberWishlist["user"];
				items: Record<string, unknown>[];
				my_recipients: IMemberWishlist["myRecipients"];
			}>(`/users/${userId}/wishlist`);

			return { user: wishlist.user, items: wishlist.items.map(mapItem), myRecipients: wishlist.my_recipients };
		},
	});
}

export function useClaimMutation(ownerId: number) {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({ itemId, claim }: { itemId: number; claim: boolean }) =>
			claim
				? apiClient.post<Record<string, unknown>>(`/wishlist/items/${itemId}/claim`)
				: apiClient.delete<Record<string, unknown>>(`/wishlist/items/${itemId}/claim`),
		// Refetch on failure too: a "someone already claimed this" error means our copy is stale.
		onSettled: () => queryClient.invalidateQueries({ queryKey: memberWishlistQueryKey(ownerId) }),
	});
}
