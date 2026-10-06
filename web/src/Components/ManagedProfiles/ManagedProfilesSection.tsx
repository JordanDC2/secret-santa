import { useState } from "react";
import { Alert, Button, Card, Group, Stack, Text as MantineText, Title } from "@mantine/core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPenToSquare, faTrashCan } from "@fortawesome/free-regular-svg-icons";
import { faChild, faListUl, faPaw, faPlus } from "@fortawesome/free-solid-svg-icons";
import { Link } from "react-router-dom";
import { useDeleteManagedProfileMutation, useManagedProfilesQuery } from "Components/ManagedProfiles/hooks";
import ManagedProfileFormModal from "Components/ManagedProfiles/ManagedProfileFormModal";
import type { IManagedProfile } from "Components/ManagedProfiles/types";
import { apiErrorMessage } from "Data/Api/Client";

/**
 * Kids and pets without a login of their own: you keep their wishlists and (soon) add them
 * to your groups. Unlike your own list, you can see what's been claimed on theirs.
 */
export default function ManagedProfilesSection() {
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
							<MantineText size="sm">Remove {profile.name} and their wishlist? This can&apos;t be undone.</MantineText>
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
						<Group key={profile.id} gap="xs" justify="space-between">
							<Group gap="sm">
								<FontAwesomeIcon icon={profile.kind === "pet" ? faPaw : faChild} fixedWidth />
								<MantineText fw={600}>{profile.name}</MantineText>
							</Group>
							<Group gap="xs">
								<Button
									component={Link}
									to={`/wishlist?for=${profile.id}`}
									size="xs"
									variant="secondary"
									leftSection={<FontAwesomeIcon icon={faListUl} />}
								>
									Wishlist
								</Button>
								<Button
									size="xs"
									variant="subtle"
									color="gray"
									leftSection={<FontAwesomeIcon icon={faPenToSquare} />}
									onClick={() => openModal(profile)}
								>
									Edit
								</Button>
								<Button
									size="xs"
									variant="subtle"
									color="red"
									leftSection={<FontAwesomeIcon icon={faTrashCan} />}
									onClick={() => setConfirmingDeleteId(profile.id)}
								>
									Remove
								</Button>
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
