import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
	ILinkPreview,
	IMemberWishlist,
	IWishlistItem,
	IWishlistItemDetails,
	IWishlistPerson,
} from "Components/Wishlist/types";
import { apiClient } from "Data/Api/Client";

// Your own list and the kids' and pets' lists you keep, all under one prefix so a change to
// any of them refreshes whichever is showing.
const MY_WISHLIST_QUERY_KEY = ["wishlist", "mine"];
export const ownWishlistQueryKey = (ownerId: number | null) => [...MY_WISHLIST_QUERY_KEY, ownerId ?? "self"];
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
						minePurchasedAt: (claim.mine_purchased_at as string | null | undefined) ?? null,
						others: (claim.others as Record<string, unknown>[]).map((other) => ({
							id: other.id as number,
							name: other.name as string | null,
							quantity: other.quantity as number,
							purchased: Boolean(other.purchased),
							claimedAt: (other.claimed_at as string | null) ?? null,
							nudgedAt: (other.nudged_at as string | null) ?? null,
						})),
					}
				: null,
		}),
		...(raw.suggestion !== undefined && { suggestion: raw.suggestion as IWishlistItem["suggestion"] }),
		...(raw.received_at !== undefined && { receivedAt: raw.received_at as string | null }),
	};
}

/** Your own list, or (given an id) a kid's or pet's list you manage, which includes claims. */
export function useMyWishlistQuery(ownerId: number | null = null) {
	return useQuery({
		queryKey: ownWishlistQueryKey(ownerId),
		queryFn: async () => {
			const items = await apiClient.get<Record<string, unknown>[]>(
				ownerId ? `/wishlist/items?owner=${ownerId}` : "/wishlist/items",
			);

			return items.map(mapItem);
		},
	});
}

/** Adds to or edits your own list, or (given an id) a kid's or pet's list you manage. */
export function useSaveWishlistItemMutation(ownerId: number | null = null) {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async ({ id, details }: { id?: number; details: IWishlistItemDetails }) => {
			const { imageUrl, ...rest } = details;
			const body = { ...rest, image_url: imageUrl, ...(ownerId && !id && { owner_id: ownerId }) };
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

/** "Got it" (or undo): received items leave your list for everyone and move to your history. */
export function useSetReceivedMutation() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({ id, received }: { id: number; received: boolean }) =>
			received
				? apiClient.post<Record<string, unknown>>(`/wishlist/items/${id}/received`)
				: apiClient.delete<Record<string, unknown>>(`/wishlist/items/${id}/received`),
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
				my_recipients: (IWishlistPerson & {
					santa_name: string | null;
					group: { id: number; name: string; exchange_date: string | null; budget: string | null };
				})[];
			}>(`/users/${userId}/wishlist`);

			return {
				user: wishlist.user,
				items: wishlist.items.map(mapItem),
				suggestions: wishlist.suggestions.map(mapItem),
				myRecipients: wishlist.my_recipients.map((recipient) => ({
					id: recipient.id,
					name: recipient.name,
					santaName: recipient.santa_name,
					group: {
						id: recipient.group.id,
						name: recipient.group.name,
						exchangeDate: recipient.group.exchange_date,
						budget: recipient.group.budget,
					},
				})),
			};
		},
	});
}

/**
 * What you can do with your claim on someone's item: claim it (or more of it), undo it, or
 * mark it bought / not bought yet.
 */
export type IClaimAction = "claim" | "unclaim" | "purchase" | "unpurchase";

export function useClaimMutation(ownerId: number) {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({ itemId, action, quantity = 1 }: { itemId: number; action: IClaimAction; quantity?: number }) => {
			const url = `/wishlist/items/${itemId}/claim`;

			switch (action) {
				case "claim":
					return apiClient.post<Record<string, unknown>>(url, { quantity });
				case "unclaim":
					return apiClient.delete<Record<string, unknown>>(url);
				case "purchase":
					return apiClient.post<Record<string, unknown>>(`${url}/purchased`);
				case "unpurchase":
					return apiClient.delete<Record<string, unknown>>(`${url}/purchased`);
			}
		},
		// Refetch on failure too: a "someone already claimed this" error means our copy is stale.
		onSettled: () => queryClient.invalidateQueries({ queryKey: memberWishlistQueryKey(ownerId) }),
	});
}

/** Emails someone who claimed a gift but hasn't marked it bought: still getting it? */
export function useNudgeMutation(ownerId: number) {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (claimId: number) => apiClient.post<void>(`/wishlist/claims/${claimId}/nudge`),
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
