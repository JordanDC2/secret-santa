import { Accordion, Alert, Button, Group, NumberInput, Stack, Text as MantineText, Title } from "@mantine/core";
import Page from "Components/Layout/Page";
import LoadingText from "Components/Common/LoadingText";
import { useState } from "react";
import { Navigate, useParams } from "react-router-dom";
import ConfirmButtons from "Components/Common/ConfirmButtons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
	faBell,
	faCheck,
	faCircleQuestion,
	faGift,
	faLightbulb,
	faPenToSquare,
	faTrashCan,
} from "@fortawesome/free-solid-svg-icons";
import WishListIcon from "Components/Common/FestiveIcons/WishListIcon";
import { useAuth } from "Components/Auth/AuthContext";
import AssignmentNotice from "Components/Wishlist/AssignmentNotice";
import ClaimStatus, { remainingQuantity } from "Components/Wishlist/ClaimStatus";
import {
	useClaimMutation,
	useDeleteSuggestionMutation,
	useMemberWishlistQuery,
	useNudgeMutation,
} from "Components/Wishlist/hooks";
import WishlistItemFormModal from "Components/Wishlist/WishlistItemFormModal";
import WishlistLiveUpdates from "Components/Wishlist/WishlistLiveUpdates";
import { liveUpdatesEnabled } from "Data/Api/LiveUpdates";
import type { IWishlistItem } from "Components/Wishlist/types";
import WishlistItemRow from "Components/Wishlist/WishlistItemRow";
import BackToGroups from "Components/Layout/BackToGroups";
import PageTitle from "Components/Layout/PageTitle";
import SantaChatModal from "Components/SantaChat/SantaChatModal";
import type { ISantaChatTarget } from "Components/SantaChat/types";
import { apiErrorMessage } from "Data/Api/Client";
import classes from "Components/Wishlist/WishlistPage.module.less";

/** Matches the server's limit (NudgeClaimHandler::COOLDOWN_DAYS). */
const NUDGE_COOLDOWN_DAYS = 3;

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
	const nudge = useNudgeMutation(userId);
	const [confirmingDeleteId, setConfirmingDeleteId] = useState<number | null>(null);
	// "Ask about this" opens your Santa chat with this person, starting the message for you.
	const [askModal, setAskModal] = useState<{ opened: boolean; target: ISantaChatTarget | null; key: number }>({
		opened: false,
		target: null,
		key: 0,
	});

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
					<ConfirmButtons
						size="xs"
						confirmLabel="Remove"
						color="red"
						isPending={deleteSuggestion.isPending}
						onConfirm={() => deleteSuggestion.mutate(item.id, { onSuccess: () => setConfirmingDeleteId(null) })}
						onCancel={() => setConfirmingDeleteId(null)}
					/>
				</>
			);
		}

		return (
			<>
				{claimActions(item)}
				<Button
					size="xs"
					variant="secondary"
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
	// If you drew this person in more than one group, ask in the first; the chat names the group.
	const askGroup = myRecipients.find((recipient) => recipient.id === userId)?.group ?? null;

	function askAbout(item: IWishlistItem) {
		if (askGroup) {
			setAskModal((current) => ({
				opened: true,
				target: { groupId: askGroup.id, groupName: askGroup.name, side: "my-person", draft: `About "${item.name}": ` },
				key: current.key + 1,
			}));
		}
	}

	function claimItem(itemId: number, quantity: number) {
		claim.mutate({ itemId, action: "claim", quantity }, { onSettled: () => setConfirmingClaim(null) });
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
					<ConfirmButtons
						size="xs"
						confirmLabel={<>Yes, I&apos;m getting {item.quantity === 1 ? "this" : confirmingClaim.quantity}</>}
						isPending={isThisItem}
						onConfirm={() => claimItem(item.id, confirmingClaim.quantity)}
						onCancel={() => setConfirmingClaim(null)}
					/>
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
				{mine > 0 &&
					(item.claim?.minePurchasedAt ? (
						<Button
							size="xs"
							variant="subtle"
							color="gray"
							loading={isThisItem}
							onClick={() => claim.mutate({ itemId: item.id, action: "unpurchase" })}
						>
							Not bought yet
						</Button>
					) : (
						<Button
							size="xs"
							variant="secondary"
							leftSection={<FontAwesomeIcon icon={faCheck} />}
							loading={isThisItem}
							onClick={() => claim.mutate({ itemId: item.id, action: "purchase" })}
						>
							Bought it
						</Button>
					))}
				{mine > 0 && (
					<Button
						size="xs"
						variant="subtle"
						color="gray"
						loading={isThisItem}
						onClick={() => claim.mutate({ itemId: item.id, action: "unclaim" })}
					>
						Undo my claim
					</Button>
				)}
				{nudgeButtons(item)}
			</>
		);
	}

	/** One "Nudge" per other person's unbought claim; a claim can be nudged once every 3 days. */
	function nudgeButtons(item: IWishlistItem) {
		return (item.claim?.others ?? [])
			.filter((other) => !other.purchased)
			.map((other) => {
				const daysSinceNudge = other.nudgedAt
					? Math.floor((Date.now() - new Date(other.nudgedAt).getTime()) / 86_400_000)
					: null;
				const recentlyNudged = daysSinceNudge !== null && daysSinceNudge < NUDGE_COOLDOWN_DAYS;

				return (
					<Button
						key={other.id}
						size="xs"
						variant="secondary"
						leftSection={<FontAwesomeIcon icon={faBell} />}
						disabled={recentlyNudged}
						loading={nudge.isPending && nudge.variables === other.id}
						onClick={() => nudge.mutate(other.id)}
					>
						{recentlyNudged
							? `Nudged ${daysSinceNudge === 0 ? "today" : daysSinceNudge === 1 ? "yesterday" : `${daysSinceNudge} days ago`}`
							: `Nudge ${other.name ?? "them"}`}
					</Button>
				);
			});
	}

	return (
		<Page>
			{liveUpdatesEnabled() && <WishlistLiveUpdates ownerId={userId} />}
			<Stack gap="lg">
				<BackToGroups />

				{wishlistQuery.isPending && <LoadingText>Loading wishlist...</LoadingText>}

				{wishlistQuery.isError && <Alert color="red">{apiErrorMessage(wishlistQuery.error)}</Alert>}

				{wishlistQuery.isSuccess && (
					<>
						<PageTitle icon={<WishListIcon />}>{wishlistQuery.data.user.name}&apos;s wishlist</PageTitle>
						<AssignmentNotice owner={wishlistQuery.data.user} myRecipients={wishlistQuery.data.myRecipients} />
						<MantineText c="dimmed">
							Claim something so nobody else buys it too. {wishlistQuery.data.user.firstName} can&apos;t see who claimed
							what.
						</MantineText>

						{claim.isError && <Alert color="red">{apiErrorMessage(claim.error)}</Alert>}
						{nudge.isError && <Alert color="red">{apiErrorMessage(nudge.error)}</Alert>}

						{wishlistQuery.data.items.length === 0 && (
							<MantineText c="dimmed">
								{wishlistQuery.data.user.firstName} hasn&apos;t added anything yet. Maybe drop them a hint?
							</MantineText>
						)}

						{wishlistQuery.data.items.length > 0 && (
							<Accordion variant="contained" radius="md" multiple className={classes.list}>
								{wishlistQuery.data.items.map((item) => (
									<WishlistItemRow
										key={item.id}
										item={item}
										status={<ClaimStatus item={item} />}
										actions={
											<>
												{claimActions(item)}
												{/* Not on gift ideas: the person can't see those, so asking would spoil them. */}
												{askGroup && (
													<Button
														size="xs"
														variant="secondary"
														leftSection={<FontAwesomeIcon icon={faCircleQuestion} />}
														onClick={() => askAbout(item)}
													>
														Ask about this
													</Button>
												)}
											</>
										}
										dimmed={remainingQuantity(item) === 0 && !item.claim?.mine}
									/>
								))}
							</Accordion>
						)}

						<Stack gap="sm" mt="md">
							<Group justify="space-between" align="flex-end" gap="sm">
								<div>
									<Title order={2} size="h3">
										Gift ideas from the group
									</Title>
									<MantineText size="sm" c="dimmed">
										{wishlistQuery.data.user.firstName} can&apos;t see these. Know something they&apos;d love?
									</MantineText>
								</div>
								<Button
									variant="secondary"
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

						{askModal.target && (
							<SantaChatModal
								key={askModal.key}
								target={askModal.target}
								opened={askModal.opened}
								onClose={() => setAskModal((current) => ({ ...current, opened: false }))}
							/>
						)}

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
		</Page>
	);
}
