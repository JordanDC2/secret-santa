import {
	Accordion,
	Alert,
	Anchor,
	Button,
	Container,
	Group,
	NumberInput,
	Stack,
	Text as MantineText,
	Title,
} from "@mantine/core";
import { useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faGift, faLightbulb, faPenToSquare, faTrashCan } from "@fortawesome/free-solid-svg-icons";
import WishListIcon from "Components/Common/FestiveIcons/WishListIcon";
import { useAuth } from "Components/Auth/AuthContext";
import AssignmentNotice from "Components/Wishlist/AssignmentNotice";
import ClaimStatus, { remainingQuantity } from "Components/Wishlist/ClaimStatus";
import { useClaimMutation, useDeleteSuggestionMutation, useMemberWishlistQuery } from "Components/Wishlist/hooks";
import WishlistItemFormModal from "Components/Wishlist/WishlistItemFormModal";
import WishlistLiveUpdates from "Components/Wishlist/WishlistLiveUpdates";
import { liveUpdatesEnabled } from "Data/Api/LiveUpdates";
import type { IWishlistItem } from "Components/Wishlist/types";
import WishlistItemRow from "Components/Wishlist/WishlistItemRow";
import PageTitle from "Components/Layout/PageTitle";
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

function MemberWishlist({ userId }: { userId: number }) {
	const wishlistQuery = useMemberWishlistQuery(userId);
	const claim = useClaimMutation(userId);
	// Which item is waiting on "this isn't your person, claim anyway?", and how many to claim.
	const [confirmingClaim, setConfirmingClaim] = useState<{ itemId: number; quantity: number } | null>(null);
	// The "how many" picker per item, for items with a quantity above 1.
	const [chosenQuantity, setChosenQuantity] = useState<Record<number, number>>({});
	// The gift-idea form; a fresh key each time it opens so it starts from the chosen item.
	const [ideaModal, setIdeaModal] = useState<{ opened: boolean; item: IWishlistItem | null; key: number }>({
		opened: false,
		item: null,
		key: 0,
	});
	const deleteSuggestion = useDeleteSuggestionMutation(userId);
	const [confirmingDeleteId, setConfirmingDeleteId] = useState<number | null>(null);

	function openIdeaModal(item: IWishlistItem | null) {
		setIdeaModal((current) => ({ opened: true, item, key: current.key + 1 }));
	}

	function suggestionActions(item: IWishlistItem) {
		if (confirmingDeleteId === item.id) {
			const othersClaimed = (item.claim?.claimed ?? 0) - (item.claim?.mine ?? 0) > 0;

			return (
				<>
					<MantineText size="sm">
						Remove this gift idea?{othersClaimed && " Someone's already getting it."}
						{!item.suggestion?.mine && item.suggestion?.by && ` ${item.suggestion.by} will get an email.`}
					</MantineText>
					<Button
						size="xs"
						color="red"
						loading={deleteSuggestion.isPending}
						onClick={() => deleteSuggestion.mutate(item.id, { onSuccess: () => setConfirmingDeleteId(null) })}
					>
						Remove
					</Button>
					<Button size="xs" variant="subtle" onClick={() => setConfirmingDeleteId(null)}>
						Cancel
					</Button>
				</>
			);
		}

		return (
			<>
				{claimActions(item)}
				<Button
					size="xs"
					variant="default"
					leftSection={<FontAwesomeIcon icon={faPenToSquare} />}
					onClick={() => openIdeaModal(item)}
				>
					Edit
				</Button>
				<Button
					size="xs"
					variant="subtle"
					color="red"
					leftSection={<FontAwesomeIcon icon={faTrashCan} />}
					onClick={() => setConfirmingDeleteId(item.id)}
				>
					Remove
				</Button>
			</>
		);
	}

	const myRecipients = wishlistQuery.data?.myRecipients ?? [];
	// Once names are drawn, claiming for anyone but your own person takes a second click.
	const claimNeedsConfirm = myRecipients.length > 0 && !myRecipients.some((recipient) => recipient.id === userId);

	function claimItem(itemId: number, quantity: number) {
		claim.mutate({ itemId, claim: true, quantity }, { onSettled: () => setConfirmingClaim(null) });
	}

	function claimActions(item: IWishlistItem) {
		const isThisItem = claim.isPending && claim.variables?.itemId === item.id;
		const remaining = remainingQuantity(item);
		const mine = item.claim?.mine ?? 0;
		const quantity = Math.min(chosenQuantity[item.id] ?? 1, Math.max(remaining, 1));

		if (confirmingClaim?.itemId === item.id) {
			return (
				<>
					<MantineText size="sm">This isn&apos;t your Secret Santa person. Claim anyway?</MantineText>
					<Button
						size="xs"
						color="green"
						loading={isThisItem}
						onClick={() => claimItem(item.id, confirmingClaim.quantity)}
					>
						Yes, I&apos;m getting {item.quantity === 1 ? "this" : confirmingClaim.quantity}
					</Button>
					<Button size="xs" variant="subtle" onClick={() => setConfirmingClaim(null)}>
						Cancel
					</Button>
				</>
			);
		}

		const claimLabel =
			item.quantity === 1 ? "I'll get this" : mine > 0 ? `I'll get ${quantity} more` : `I'll get ${quantity}`;

		return (
			<>
				{remaining > 0 && item.quantity > 1 && (
					<NumberInput
						aria-label="How many to claim"
						size="xs"
						w={64}
						min={1}
						max={remaining}
						allowDecimal={false}
						clampBehavior="strict"
						value={quantity}
						onChange={(value) => setChosenQuantity((current) => ({ ...current, [item.id]: Number(value) || 1 }))}
					/>
				)}
				{remaining > 0 && (
					<Button
						leftSection={<FontAwesomeIcon icon={faGift} />}
						size="xs"
						color="green"
						loading={isThisItem}
						onClick={() =>
							claimNeedsConfirm && mine === 0
								? setConfirmingClaim({ itemId: item.id, quantity })
								: claimItem(item.id, quantity)
						}
					>
						{claimLabel}
					</Button>
				)}
				{mine > 0 && (
					<Button
						size="xs"
						variant="subtle"
						loading={isThisItem}
						onClick={() => claim.mutate({ itemId: item.id, claim: false })}
					>
						Undo my claim
					</Button>
				)}
			</>
		);
	}

	return (
		<Container my={40}>
			{liveUpdatesEnabled() && <WishlistLiveUpdates ownerId={userId} />}
			<Stack gap="lg">
				<Anchor component={Link} to="/" size="sm">
					← Back to your groups
				</Anchor>

				{wishlistQuery.isPending && <MantineText c="dimmed">Loading wishlist...</MantineText>}

				{wishlistQuery.isError && <Alert color="red">{apiErrorMessage(wishlistQuery.error)}</Alert>}

				{wishlistQuery.isSuccess && (
					<>
						<PageTitle icon={<WishListIcon />}>{wishlistQuery.data.user.name}&apos;s wishlist</PageTitle>
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
										status={<ClaimStatus item={item} />}
										actions={claimActions(item)}
										dimmed={remainingQuantity(item) === 0 && !item.claim?.mine}
									/>
								))}
							</Accordion>
						)}

						<Stack gap="sm" mt="md">
							<Group justify="space-between" align="flex-end" gap="sm">
								<div>
									<Title order={3}>Gift ideas from the group</Title>
									<MantineText size="sm" c="dimmed">
										{wishlistQuery.data.user.name} can&apos;t see these. Know something they&apos;d love?
									</MantineText>
								</div>
								<Button
									variant="light"
									color="green"
									leftSection={<FontAwesomeIcon icon={faLightbulb} />}
									onClick={() => openIdeaModal(null)}
								>
									Suggest a gift
								</Button>
							</Group>

							{deleteSuggestion.isError && <Alert color="red">{apiErrorMessage(deleteSuggestion.error)}</Alert>}

							{wishlistQuery.data.suggestions.length > 0 && (
								<Accordion variant="contained" radius="md" multiple className={classes.list}>
									{wishlistQuery.data.suggestions.map((item) => (
										<WishlistItemRow
											key={item.id}
											item={item}
											status={
												<Stack gap={2}>
													<MantineText size="xs" c="dimmed">
														Suggested by {item.suggestion?.mine ? "you" : (item.suggestion?.by ?? "someone")}
													</MantineText>
													<ClaimStatus item={item} />
												</Stack>
											}
											actions={suggestionActions(item)}
											dimmed={remainingQuantity(item) === 0 && !item.claim?.mine}
										/>
									))}
								</Accordion>
							)}
						</Stack>

						<WishlistItemFormModal
							key={ideaModal.key}
							opened={ideaModal.opened}
							item={ideaModal.item}
							suggestionFor={wishlistQuery.data.user}
							onClose={() => setIdeaModal((current) => ({ ...current, opened: false }))}
						/>
					</>
				)}
			</Stack>
		</Container>
	);
}
