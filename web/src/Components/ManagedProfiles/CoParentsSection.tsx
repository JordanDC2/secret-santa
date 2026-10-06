import { useState } from "react";
import { ActionIcon, Alert, Button, Group, Select, Stack, Text as MantineText, Title, Tooltip } from "@mantine/core";
import ConfirmButtons from "Components/Common/ConfirmButtons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUserPlus, faXmark } from "@fortawesome/free-solid-svg-icons";
import { useAuth } from "Components/Auth/AuthContext";
import { useGroupsQuery } from "Components/Groups/hooks";
import { useManagedProfilesQuery, useSetCoParentMutation } from "Components/ManagedProfiles/hooks";
import { apiErrorMessage } from "Data/Api/Client";

/**
 * Who looks after a kid or pet. Anyone looking after them can share with someone from their
 * groups, or take someone (themselves included) off, as long as someone's left.
 */
export default function CoParentsSection({ profileId }: { profileId: number }) {
	const { user } = useAuth();
	// Read live, so the list updates as people are added or removed.
	const profile = useManagedProfilesQuery().data?.find((candidate) => candidate.id === profileId);
	const groups = useGroupsQuery().data ?? [];
	const setCoParent = useSetCoParentMutation(profileId);
	const [choice, setChoice] = useState<string | null>(null);
	// Removing someone asks first: they lose this kid's or pet's list, draws and chats.
	const [confirmingRemoveId, setConfirmingRemoveId] = useState<number | null>(null);

	if (!profile) {
		// Gone, e.g. you just stopped looking after them.
		return null;
	}

	const managerIds = new Set(profile.managers.map((manager) => manager.id));
	// Adults from your groups who don't already look after them, in the order your groups list them.
	const candidates = [
		...new Map(
			groups
				.flatMap((group) => group.members)
				.filter((member) => member.kind === null && member.id !== user?.id && !managerIds.has(member.id))
				.map((member) => [member.id, member]),
		).values(),
	];
	const lastOne = profile.managers.length === 1;

	return (
		<Stack gap="xs">
			<Title order={3} size="h5">
				Who looks after {profile.name}
			</Title>
			{setCoParent.isError && <Alert color="red">{apiErrorMessage(setCoParent.error)}</Alert>}
			{profile.managers.map((manager) => (
				<Group key={manager.id} justify="space-between">
					<MantineText size="sm">{manager.id === user?.id ? "You" : manager.name}</MantineText>
					{confirmingRemoveId === manager.id ? (
						<ConfirmButtons
							size="xs"
							confirmLabel={manager.id === user?.id ? "Stop looking after them" : "Remove"}
							color="red"
							isPending={setCoParent.isPending}
							onConfirm={() =>
								setCoParent.mutate({ userId: manager.id, add: false }, { onSuccess: () => setConfirmingRemoveId(null) })
							}
							onCancel={() => setConfirmingRemoveId(null)}
						/>
					) : (
						<Tooltip
							label={
								lastOne
									? `${profile.name} needs someone looking after them`
									: manager.id === user?.id
										? "Stop looking after them"
										: "Remove"
							}
							withArrow
						>
							<ActionIcon
								variant="subtle"
								color="red"
								size="input-xs"
								aria-label={manager.id === user?.id ? `Stop looking after ${profile.name}` : `Remove ${manager.name}`}
								disabled={lastOne}
								onClick={() => setConfirmingRemoveId(manager.id)}
							>
								<FontAwesomeIcon icon={faXmark} />
							</ActionIcon>
						</Tooltip>
					)}
				</Group>
			))}
			<Group gap="xs" align="flex-end" wrap="nowrap">
				<Select
					flex={1}
					size="sm"
					label="Share with"
					placeholder={candidates.length ? "Someone from your groups" : "No one else in your groups yet"}
					searchable
					disabled={candidates.length === 0}
					data={candidates.map((candidate) => ({ value: String(candidate.id), label: candidate.name }))}
					value={choice}
					onChange={setChoice}
				/>
				<Button
					leftSection={<FontAwesomeIcon icon={faUserPlus} />}
					disabled={!choice}
					loading={setCoParent.isPending && setCoParent.variables?.add === true}
					onClick={() =>
						choice && setCoParent.mutate({ userId: Number(choice), add: true }, { onSuccess: () => setChoice(null) })
					}
				>
					Share
				</Button>
			</Group>
			<MantineText size="xs" c="dimmed">
				They&apos;ll get an email, and can keep {profile.name}&apos;s wishlist, see claims, and handle their draws and
				Santa chats.
			</MantineText>
		</Stack>
	);
}
