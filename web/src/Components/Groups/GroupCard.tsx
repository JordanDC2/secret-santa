import { Badge, Card, Group, Text as MantineText, Title } from "@mantine/core";
import type { IGroup } from "Components/Groups/types";
import AssignmentReveal from "Components/Groups/AssignmentReveal";
import DrawNamesControl from "Components/Groups/DrawNamesControl";

type IGroupCardProps = {
	group: IGroup;
};

export default function GroupCard({ group }: IGroupCardProps) {
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

			{!group.isDrawn && group.isOwner && <DrawNamesControl groupId={group.id} />}

			{!group.isDrawn && !group.isOwner && (
				<MantineText size="sm" c="dimmed" mt="md">
					Waiting for the group owner to draw names.
				</MantineText>
			)}

			{group.isDrawn && group.myAssignment && <AssignmentReveal recipientName={group.myAssignment.recipientName} />}

			{group.isDrawn && !group.myAssignment && (
				<MantineText size="sm" c="dimmed" mt="md">
					Names have already been drawn for this group.
				</MantineText>
			)}
		</Card>
	);
}
