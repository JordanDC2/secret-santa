import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ILinkPreview, IMemberWishlist, IWishlistItem, IWishlistItemDetails } from "Components/Wishlist/types";
import { apiClient } from "Data/Api/Client";

const MY_WISHLIST_QUERY_KEY = ["wishlist", "mine"];
export const memberWishlistQueryKey = (userId: number) => ["wishlist", "member", userId];

function mapItem(raw: Record<string, unknown>): IWishlistItem {
	const claim = raw.claim as Record<string, unknown> | null | undefined;

	return {
		id: raw.id as number,
		name: raw.name as string,
		url: raw.url as string | null,
		imageUrl: (raw.image_url as string | null) ?? null,
		price: raw.price === null ? null : Number(raw.price),
		quantity: (raw.quantity as number | undefined) ?? 1,
		notes: raw.notes as string | null,
		rating: (raw.rating as number | null) ?? null,
		...(claim !== undefined && {
			claim: claim
				? {
						claimed: claim.claimed as number,
						mine: claim.mine as number,
						others: claim.others as { name: string | null; quantity: number }[],
					}
				: null,
		}),
		...(raw.suggestion !== undefined && { suggestion: raw.suggestion as IWishlistItem["suggestion"] }),
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
			const { imageUrl, ...rest } = details;
			const body = { ...rest, image_url: imageUrl };
			const item = id
				? await apiClient.patch<Record<string, unknown>>(`/wishlist/items/${id}`, body)
				: await apiClient.post<Record<string, unknown>>("/wishlist/items", body);

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
				suggestions: Record<string, unknown>[];
				my_recipients: IMemberWishlist["myRecipients"];
			}>(`/users/${userId}/wishlist`);

			return {
				user: wishlist.user,
				items: wishlist.items.map(mapItem),
				suggestions: wishlist.suggestions.map(mapItem),
				myRecipients: wishlist.my_recipients,
			};
		},
	});
}

export function useClaimMutation(ownerId: number) {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({ itemId, claim, quantity = 1 }: { itemId: number; claim: boolean; quantity?: number }) =>
			claim
				? apiClient.post<Record<string, unknown>>(`/wishlist/items/${itemId}/claim`, { quantity })
				: apiClient.delete<Record<string, unknown>>(`/wishlist/items/${itemId}/claim`),
		// Refetch on failure too: a "someone already claimed this" error means our copy is stale.
		onSettled: () => queryClient.invalidateQueries({ queryKey: memberWishlistQueryKey(ownerId) }),
	});
}

/**
 * Adds or edits a gift idea on someone else's list. Anyone shopping for them can edit one;
 * the suggester gets an email when someone else does.
 */
export function useSaveSuggestionMutation(ownerId: number) {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async ({ id, details }: { id?: number; details: IWishlistItemDetails }) => {
			const { imageUrl, rating: _rating, ...rest } = details;
			const body = { ...rest, image_url: imageUrl };
			const item = id
				? await apiClient.patch<Record<string, unknown>>(`/wishlist/items/${id}`, body)
				: await apiClient.post<Record<string, unknown>>(`/users/${ownerId}/wishlist/suggestions`, body);

			return mapItem(item);
		},
		onSuccess: () => queryClient.invalidateQueries({ queryKey: memberWishlistQueryKey(ownerId) }),
	});
}

export function useDeleteSuggestionMutation(ownerId: number) {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (id: number) => apiClient.delete<void>(`/wishlist/items/${id}`),
		onSuccess: () => queryClient.invalidateQueries({ queryKey: memberWishlistQueryKey(ownerId) }),
	});
}

/** Reads a product link on the server (the browser can't fetch other sites' pages). */
export function useLinkPreviewMutation() {
	return useMutation({
		mutationFn: async (url: string): Promise<ILinkPreview> => {
			const preview = await apiClient.post<{ name: string | null; price: number | null; image_url: string | null }>(
				"/wishlist/link-preview",
				{ url },
			);

			return { name: preview.name, price: preview.price, imageUrl: preview.image_url };
		},
	});
}
