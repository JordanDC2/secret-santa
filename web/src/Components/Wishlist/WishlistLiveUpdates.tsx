import { useEcho } from "@laravel/echo-react";
import { useQueryClient } from "@tanstack/react-query";
import { memberWishlistQueryKey } from "Components/Wishlist/hooks";

/** Refreshes someone's list live as items and claims change. The owner is never allowed on this channel. */
export default function WishlistLiveUpdates({ ownerId }: { ownerId: number }) {
	const queryClient = useQueryClient();

	useEcho(`wishlist.${ownerId}`, ".wishlist.changed", () => {
		void queryClient.invalidateQueries({ queryKey: memberWishlistQueryKey(ownerId) });
	});

	return null;
}
