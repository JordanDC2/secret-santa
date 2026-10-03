import { Stack, Text as MantineText } from "@mantine/core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheck } from "@fortawesome/free-solid-svg-icons";
import type { IWishlistItem } from "Components/Wishlist/types";

/** How many of an item are still up for grabs. */
export function remainingQuantity(item: IWishlistItem) {
	return Math.max(0, item.quantity - (item.claim?.claimed ?? 0));
}

/**
 * The claim line(s) under an item's name on someone else's list, e.g. "You're getting
 * 1 of 2" and "1 of 2 claimed by Ivy". Plain text, not a Badge, so it wraps on phones.
 */
export default function ClaimStatus({ item }: { item: IWishlistItem }) {
	if (!item.claim) {
		return null;
	}

	const { mine, others } = item.claim;
	const isSingle = item.quantity === 1;
	const ofTotal = (count: number) => (isSingle ? "" : ` ${count} of ${item.quantity}`);
	const names = others.map((claim) => claim.name ?? "someone");
	const othersCount = others.reduce((total, claim) => total + claim.quantity, 0);

	return (
		<Stack gap={2}>
			{mine > 0 && (
				<MantineText size="xs" fw={700} c="green.8">
					<FontAwesomeIcon icon={faCheck} /> You&apos;re getting{isSingle ? " this" : ofTotal(mine)}
				</MantineText>
			)}
			{othersCount > 0 && (
				<MantineText size="xs" fw={600} c="dimmed">
					{isSingle ? "Claimed" : `${othersCount} of ${item.quantity} claimed`} by {names.join(", ")}
				</MantineText>
			)}
		</Stack>
	);
}
