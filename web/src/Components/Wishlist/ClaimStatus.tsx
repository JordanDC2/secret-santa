import { Stack, Text as MantineText } from "@mantine/core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheck } from "@fortawesome/free-solid-svg-icons";
import type { IWishlistItem } from "Components/Wishlist/types";

/** How many of an item are still up for grabs. */
export function remainingQuantity(item: IWishlistItem) {
	return Math.max(0, item.quantity - (item.claim?.claimed ?? 0));
}

/** "Nov 2026" */
export function monthYear(isoDate: string) {
	return new Date(isoDate).toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

/**
 * The claim line(s) under an item's name on someone else's list, e.g. "You're getting
 * 1 of 2", "Bought by Ivy" or "Claimed by Nick · Nov 2026". Plain text, not a Badge, so it
 * wraps on phones.
 */
export default function ClaimStatus({ item }: { item: IWishlistItem }) {
	if (!item.claim) {
		return null;
	}

	const { mine, minePurchasedAt, others } = item.claim;
	const isSingle = item.quantity === 1;
	const ofTotal = (count: number) => (isSingle ? "" : ` ${count} of ${item.quantity}`);

	return (
		<Stack gap={2}>
			{mine > 0 && (
				<MantineText size="xs" fw={700} c="green.8">
					<FontAwesomeIcon icon={faCheck} />{" "}
					{minePurchasedAt
						? `You bought ${isSingle ? "this" : mine}`
						: `You're getting${isSingle ? " this" : ofTotal(mine)}`}
				</MantineText>
			)}
			{others.map((claim) => (
				<MantineText key={claim.id} size="xs" fw={600} c="dimmed">
					{claim.purchased ? "Bought" : "Claimed"}
					{isSingle ? "" : ` ${claim.quantity}`} by {claim.name ?? "someone"}
					{!claim.purchased && claim.claimedAt && ` · ${monthYear(claim.claimedAt)}`}
				</MantineText>
			))}
		</Stack>
	);
}
