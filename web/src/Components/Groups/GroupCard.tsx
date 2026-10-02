import { useState } from "react";
import { Badge, Card, Group, Stack, Text as MantineText } from "@mantine/core";
import type { IGroup } from "Components/Groups/types";
import AssignmentReveal from "Components/Groups/AssignmentReveal";
import DeleteGroupControl from "Components/Groups/DeleteGroupControl";
import DrawNamesControl from "Components/Groups/DrawNamesControl";
import GroupMembers from "Components/Groups/GroupMembers";
import GroupNameEditor from "Components/Groups/GroupNameEditor";
import InviteCode from "Components/Groups/InviteCode";
import LeaveGroupControl from "Components/Groups/LeaveGroupControl";

type IGroupCardProps = {
	group: IGroup;
};

function GroupStatus({ group }: IGroupCardProps) {
	if (!group.isDrawn) {
		return group.isOwner ? null : (
			<MantineText size="sm" c="dimmed">
				Waiting for the group owner to draw names.
			</MantineText>
		);
	}

	return group.myAssignment ? (
		<AssignmentReveal recipientId={group.myAssignment.recipientId} recipientName={group.myAssignment.recipientName} />
	) : (
		<MantineText size="sm" c="dimmed">
			Names have already been drawn for this group.
		</MantineText>
	);
}

type IGroupAction = "draw" | "delete" | "leave";

export default function GroupCard({ group }: IGroupCardProps) {
	// Only one "are you sure?" panel at a time, and it takes the whole footer.
	const [openAction, setOpenAction] = useState<IGroupAction | null>(null);
	const canDraw = group.isOwner && !group.isDrawn;
	const canLeave = !group.isOwner && !group.isDrawn;

	function confirmState(action: IGroupAction) {
		return {
			confirming: openAction === action,
			onConfirmingChange: (confirming: boolean) => setOpenAction(confirming ? action : null),
		};
	}

	const controls: Record<IGroupAction, JSX.Element | null> = {
		draw: canDraw ? (
			<DrawNamesControl groupId={group.id} membersCount={group.membersCount} {...confirmState("draw")} />
		) : null,
		delete: group.isOwner ? (
			<DeleteGroupControl groupId={group.id} groupName={group.name} {...confirmState("delete")} />
		) : null,
		leave: canLeave ? <LeaveGroupControl groupId={group.id} groupName={group.name} {...confirmState("leave")} /> : null,
	};
	const hasControls = Object.values(controls).some(Boolean);

	return (
		<Card withBorder padding="lg" radius="md">
			<Group justify="space-between" wrap="nowrap" align="flex-start">
				<GroupNameEditor groupId={group.id} name={group.name} canRename={group.isOwner} />
				{group.isOwner && <Badge color="blue">Owner</Badge>}
			</Group>
			<Group gap="md" mt={4}>
				<MantineText size="sm" c="dimmed">
					{group.membersCount} member{group.membersCount === 1 ? "" : "s"}
				</MantineText>
				<InviteCode code={group.joinCode} />
			</Group>
			<GroupMembers members={group.members} />

			<Card.Section inheritPadding py="md" mt="md" withBorder>
				<Stack gap="md">
					<GroupStatus group={group} />

					{openAction
						? controls[openAction]
						: hasControls && (
								<Group justify="space-between" align="center">
									{controls.draw ?? <span />}
									{controls.delete ?? controls.leave}
								</Group>
							)}
				</Stack>
			</Card.Section>
		</Card>
	);
}
