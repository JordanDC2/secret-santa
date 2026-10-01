import { useState } from "react";
import { Alert, Badge, Button, Card, Group, Stack, Text as MantineText, Title } from "@mantine/core";
import type { IGroup } from "Data/Interfaces/IGroup";
import { useDrawNamesMutation } from "Data/Hooks/Groups";
import { apiErrorMessage } from "Data/Api/Client";

type IGroupCardProps = {
	group: IGroup;
};

export default function GroupCard({ group }: IGroupCardProps) {
	const drawNames = useDrawNamesMutation();
	const [revealed, setRevealed] = useState(false);
	const [confirmingDraw, setConfirmingDraw] = useState(false);

	return (
		<Card withBorder padding="md" radius="md">
			<Group justify="space-between">
				<Title order={4}>{group.name}</Title>
				{group.isOwner && <Badge color="blue">Owner</Badge>}
			</Group>
			<MantineText size="sm" c="dimmed">
				{group.membersCount} member{group.membersCount === 1 ? "" : "s"}
			</MantineText>
			<MantineText size="sm" mt="xs">
				Invite code:{" "}
				<MantineText span fw={700}>
					{group.joinCode}
				</MantineText>
			</MantineText>

			{drawNames.isError && (
				<Alert color="red" mt="sm">
					{apiErrorMessage(drawNames.error)}
				</Alert>
			)}

			{!group.isDrawn && group.isOwner && !confirmingDraw && (
				<Button mt="md" color="green" onClick={() => setConfirmingDraw(true)}>
					🎄 Draw Names
				</Button>
			)}

			{!group.isDrawn && group.isOwner && confirmingDraw && (
				<Stack gap="xs" mt="md">
					<MantineText size="sm">
						Draw names now? Everyone will be emailed their assignment, and this can&apos;t be undone.
					</MantineText>
					<Group>
						<Button
							color="green"
							loading={drawNames.isPending}
							onClick={() => drawNames.mutate(group.id, { onSuccess: () => setConfirmingDraw(false) })}
						>
							Yes, draw names
						</Button>
						<Button variant="subtle" onClick={() => setConfirmingDraw(false)}>
							Cancel
						</Button>
					</Group>
				</Stack>
			)}

			{!group.isDrawn && !group.isOwner && (
				<MantineText size="sm" c="dimmed" mt="md">
					Waiting for the group owner to draw names.
				</MantineText>
			)}

			{group.isDrawn && group.myAssignment && (
				<Card withBorder mt="md" padding="sm" radius="md" bg={revealed ? "green.0" : undefined}>
					{revealed ? (
						<Stack gap={4}>
							<MantineText size="sm" c="dimmed">
								You&apos;re the Secret Santa for:
							</MantineText>
							<Title order={4}>🎁 {group.myAssignment.recipientName}</Title>
							<Button variant="subtle" size="xs" onClick={() => setRevealed(false)}>
								Hide
							</Button>
						</Stack>
					) : (
						<Button variant="light" color="green" onClick={() => setRevealed(true)}>
							🎁 Reveal my assignment
						</Button>
					)}
				</Card>
			)}

			{group.isDrawn && !group.myAssignment && (
				<MantineText size="sm" c="dimmed" mt="md">
					Names have already been drawn for this group.
				</MantineText>
			)}
		</Card>
	);
}
