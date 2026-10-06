import { useState } from "react";
import { ActionIcon, Alert, Button, Card, Group, Stack, Text as MantineText, Title, Tooltip } from "@mantine/core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPenToSquare, faTrashCan } from "@fortawesome/free-regular-svg-icons";
import { faChild, faListUl, faPaw, faPlus } from "@fortawesome/free-solid-svg-icons";
import { Link } from "react-router-dom";
import { useDeleteManagedProfileMutation, useManagedProfilesQuery } from "Components/ManagedProfiles/hooks";
import { useAuth } from "Components/Auth/AuthContext";
import ManagedProfileFormModal from "Components/ManagedProfiles/ManagedProfileFormModal";
import type { IManagedProfile } from "Components/ManagedProfiles/types";
import { apiErrorMessage } from "Data/Api/Client";
import classes from "Components/ManagedProfiles/ManagedProfilesSection.module.less";

/**
 * Kids and pets without a login of their own: you keep their wishlists and (soon) add them
 * to your groups. Unlike your own list, you can see what's been claimed on theirs.
 */
/** "Nick" or "Nick and Ivy": everyone else looking after them; null if it's just you. */
function coParentNames(profile: IManagedProfile, myId: number | undefined) {
	const others = profile.managers.filter((manager) => manager.id !== myId).map((manager) => manager.name);

	return others.length > 0 ? others.join(" and ") : null;
}

export default function ManagedProfilesSection() {
	const { user } = useAuth();
	const profilesQuery = useManagedProfilesQuery();
	const deleteProfile = useDeleteManagedProfileMutation();
	const [modal, setModal] = useState<{ opened: boolean; profile: IManagedProfile | null; key: number }>({
		opened: false,
		profile: null,
		key: 0,
	});
	const [confirmingDeleteId, setConfirmingDeleteId] = useState<number | null>(null);

	function openModal(profile: IManagedProfile | null) {
		setModal((current) => ({ opened: true, profile, key: current.key + 1 }));
	}

	return (
		<Card withBorder padding="lg" radius="md">
			<Group justify="space-between" mb="xs">
				<Title order={4}>Kids &amp; pets</Title>
				<Button
					size="xs"
					variant="secondary"
					leftSection={<FontAwesomeIcon icon={faPlus} />}
					onClick={() => openModal(null)}
				>
					Add
				</Button>
			</Group>
			<MantineText size="sm" c="dimmed" mb="md">
				Keep wishlists for kids and pets who don&apos;t have their own account. You can see what&apos;s been claimed on
				their lists.
			</MantineText>

			{profilesQuery.isError && <Alert color="red">{apiErrorMessage(profilesQuery.error)}</Alert>}
			{deleteProfile.isError && (
				<Alert color="red" mb="md">
					{apiErrorMessage(deleteProfile.error)}
				</Alert>
			)}

			{profilesQuery.data?.length === 0 && (
				<MantineText size="sm" c="dimmed">
					No one yet.
				</MantineText>
			)}

			<Stack gap="sm">
				{profilesQuery.data?.map((profile) =>
					confirmingDeleteId === profile.id ? (
						<Group key={profile.id} gap="xs" justify="space-between">
							<MantineText size="sm">
								Remove {profile.name} and their wishlist?
								{coParentNames(profile, user?.id) &&
									` This removes them for ${coParentNames(profile, user?.id)} too.`}{" "}
								This can&apos;t be undone.
							</MantineText>
							<Group gap="xs">
								<Button
									size="xs"
									color="red"
									loading={deleteProfile.isPending}
									onClick={() => deleteProfile.mutate(profile.id, { onSuccess: () => setConfirmingDeleteId(null) })}
								>
									Remove
								</Button>
								<Button size="xs" variant="subtle" color="gray" onClick={() => setConfirmingDeleteId(null)}>
									Cancel
								</Button>
							</Group>
						</Group>
					) : (
						<Group key={profile.id} gap="xs" justify="space-between" wrap="nowrap">
							<Group gap="xs" wrap="nowrap" flex={1} miw={0}>
								<FontAwesomeIcon icon={profile.kind === "pet" ? faPaw : faChild} fixedWidth />
								<div>
									<MantineText fw={600} className={classes.name}>
										{profile.name}
									</MantineText>
									{coParentNames(profile, user?.id) && (
										<MantineText size="xs" c="dimmed">
											with {coParentNames(profile, user?.id)}
										</MantineText>
									)}
								</div>
							</Group>
							{/* Tight spacing so the row still fits on small phones. */}
							<Group gap={2} wrap="nowrap">
								<Button
									component={Link}
									to={`/wishlist?for=${profile.id}`}
									size="xs"
									px={10}
									mr={4}
									variant="secondary"
									leftSection={<FontAwesomeIcon icon={faListUl} />}
								>
									Wishlist
								</Button>
								{/* Icons only, so the row fits on a phone; the tooltip and label name them. */}
								<Tooltip label={`Edit ${profile.firstName}`}>
									<ActionIcon
										size="input-xs"
										variant="subtle"
										color="gray"
										aria-label={`Edit ${profile.firstName}`}
										onClick={() => openModal(profile)}
									>
										<FontAwesomeIcon icon={faPenToSquare} />
									</ActionIcon>
								</Tooltip>
								<Tooltip label={`Remove ${profile.firstName}`}>
									<ActionIcon
										size="input-xs"
										variant="subtle"
										color="red"
										aria-label={`Remove ${profile.firstName}`}
										onClick={() => setConfirmingDeleteId(profile.id)}
									>
										<FontAwesomeIcon icon={faTrashCan} />
									</ActionIcon>
								</Tooltip>
							</Group>
						</Group>
					),
				)}
			</Stack>

			<ManagedProfileFormModal
				key={modal.key}
				opened={modal.opened}
				profile={modal.profile}
				onClose={() => setModal((current) => ({ ...current, opened: false }))}
			/>
		</Card>
	);
}
