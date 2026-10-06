import { useEcho } from "@laravel/echo-react";
import { useQueryClient } from "@tanstack/react-query";
import { memberWishlistQueryKey, ownWishlistQueryKey } from "Components/Wishlist/hooks";

/**
 * Refreshes someone's list live as items and claims change: as a shopper sees it, or as the
 * manager of a kid's or pet's list sees it. The owner is never allowed on this channel.
 */
export default function WishlistLiveUpdates({ ownerId }: { ownerId: number }) {
	const queryClient = useQueryClient();

	useEcho(`wishlist.${ownerId}`, ".wishlist.changed", () => {
		void queryClient.invalidateQueries({ queryKey: memberWishlistQueryKey(ownerId) });
		void queryClient.invalidateQueries({ queryKey: ownWishlistQueryKey(ownerId) });
	});

	return null;
}
