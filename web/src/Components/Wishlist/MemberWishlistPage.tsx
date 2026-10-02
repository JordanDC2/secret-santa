import { Accordion, Alert, Anchor, Badge, Button, Container, Stack, Text as MantineText } from "@mantine/core";
import { useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { useAuth } from "Components/Auth/AuthContext";
import AssignmentNotice from "Components/Wishlist/AssignmentNotice";
import { useClaimMutation, useMemberWishlistQuery } from "Components/Wishlist/hooks";
import type { IWishlistItem } from "Components/Wishlist/types";
import WishlistItemRow from "Components/Wishlist/WishlistItemRow";
import { apiErrorMessage } from "Data/Api/Client";
import classes from "Components/Wishlist/WishlistPage.module.less";

export default function MemberWishlistPage() {
	const { user } = useAuth();
	const userId = Number(useParams().userId);

	if (userId === user?.id) {
		return <Navigate to="/wishlist" replace />;
	}

	return <MemberWishlist userId={userId} />;
}

function claimStatus(item: IWishlistItem) {
	if (!item.claim) {
		return null;
	}

	return item.claim.claimedByMe ? (
		<Badge color="green">You&apos;re getting this</Badge>
	) : (
		<Badge color="gray">Claimed by {item.claim.claimedByName}</Badge>
	);
}

function MemberWishlist({ userId }: { userId: number }) {
	const wishlistQuery = useMemberWishlistQuery(userId);
	const claim = useClaimMutation(userId);
	const [confirmingClaimId, setConfirmingClaimId] = useState<number | null>(null);

	const myRecipients = wishlistQuery.data?.myRecipients ?? [];
	// Once names are drawn, claiming for anyone but your own person takes a second click.
	const claimNeedsConfirm = myRecipients.length > 0 && !myRecipients.some((recipient) => recipient.id === userId);

	function claimItem(itemId: number) {
		claim.mutate({ itemId, claim: true }, { onSettled: () => setConfirmingClaimId(null) });
	}

	function claimActions(item: IWishlistItem) {
		const isThisItem = claim.isPending && claim.variables?.itemId === item.id;

		if (!item.claim && confirmingClaimId === item.id) {
			return (
				<>
					<MantineText size="sm">This isn&apos;t your Secret Santa person. Claim anyway?</MantineText>
					<Button size="xs" color="green" loading={isThisItem} onClick={() => claimItem(item.id)}>
						Yes, I&apos;m getting this
					</Button>
					<Button size="xs" variant="subtle" onClick={() => setConfirmingClaimId(null)}>
						Cancel
					</Button>
				</>
			);
		}

		if (!item.claim) {
			return (
				<Button
					size="xs"
					color="green"
					loading={isThisItem}
					onClick={() => (claimNeedsConfirm ? setConfirmingClaimId(item.id) : claimItem(item.id))}
				>
					🎁 I&apos;ll get this
				</Button>
			);
		}

		if (item.claim.claimedByMe) {
			return (
				<Button
					size="xs"
					variant="subtle"
					loading={isThisItem}
					onClick={() => claim.mutate({ itemId: item.id, claim: false })}
				>
					Undo claim
				</Button>
			);
		}

		return null;
	}

	return (
		<Container my={40}>
			<Stack gap="lg">
				<Anchor component={Link} to="/" size="sm">
					← Back to your groups
				</Anchor>

				{wishlistQuery.isPending && <MantineText c="dimmed">Loading wishlist...</MantineText>}

				{wishlistQuery.isError && <Alert color="red">{apiErrorMessage(wishlistQuery.error)}</Alert>}

				{wishlistQuery.isSuccess && (
					<>
						<h1 className={classes.title}>📝 {wishlistQuery.data.user.name}&apos;s wishlist</h1>
						<AssignmentNotice owner={wishlistQuery.data.user} myRecipients={wishlistQuery.data.myRecipients} />
						<MantineText c="dimmed">
							Claim something so nobody else buys it too. {wishlistQuery.data.user.name} can&apos;t see who claimed
							what.
						</MantineText>

						{claim.isError && <Alert color="red">{apiErrorMessage(claim.error)}</Alert>}

						{wishlistQuery.data.items.length === 0 && (
							<MantineText c="dimmed">
								{wishlistQuery.data.user.name} hasn&apos;t added anything yet. Maybe drop them a hint?
							</MantineText>
						)}

						{wishlistQuery.data.items.length > 0 && (
							<Accordion variant="contained" radius="md" multiple className={classes.list}>
								{wishlistQuery.data.items.map((item) => (
									<WishlistItemRow
										key={item.id}
										item={item}
										status={claimStatus(item)}
										actions={claimActions(item)}
										dimmed={Boolean(item.claim && !item.claim.claimedByMe)}
									/>
								))}
							</Accordion>
						)}
					</>
				)}
			</Stack>
		</Container>
	);
}
