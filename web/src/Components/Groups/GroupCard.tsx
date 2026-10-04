import { useState } from "react";
import { ActionIcon, Badge, Button, Card, Group, Menu, Stack, Text as MantineText } from "@mantine/core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEllipsis, faTrashCan } from "@fortawesome/free-solid-svg-icons";
import type { IGroup } from "Components/Groups/types";
import AssignmentReveal from "Components/Groups/AssignmentReveal";
import DeleteGroupControl from "Components/Groups/DeleteGroupControl";
import DrawDetailsModal from "Components/Groups/DrawDetailsModal";
import DrawNamesControl from "Components/Groups/DrawNamesControl";
import ExclusionsModal from "Components/Groups/ExclusionsModal";
import GroupDescription from "Components/Groups/GroupDescription";
import GroupMembers from "Components/Groups/GroupMembers";
import GroupNameEditor from "Components/Groups/GroupNameEditor";
import InviteCode from "Components/Groups/InviteCode";
import LeaveGroupControl from "Components/Groups/LeaveGroupControl";
import StartNewDrawControl from "Components/Groups/StartNewDrawControl";
import classes from "Components/Groups/GroupCard.module.less";

type IGroupCardProps = {
	group: IGroup;
};

/** A one-line status for members, shown in the footer row beside Leave group. */
function statusMessage(group: IGroup): string | null {
	if (!group.isDrawn) {
		return group.isOwner ? null : "Waiting for the group owner to draw names.";
	}

	return group.myAssignment ? null : "Names have already been drawn for this group.";
}

type IGroupAction = "draw" | "newDraw" | "delete" | "leave";

export default function GroupCard({ group }: IGroupCardProps) {
	// Only one "are you sure?" panel at a time, and it takes the whole footer.
	const [openAction, setOpenAction] = useState<IGroupAction | null>(null);
	const [exclusionsOpen, setExclusionsOpen] = useState(false);
	const [drawDetailsOpen, setDrawDetailsOpen] = useState(false);
	const canViewDraw = group.isOwner && group.isDrawn;
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
			<DrawNamesControl
				groupId={group.id}
				membersCount={group.membersCount}
				hasPreviousDraw={group.hasPreviousDraw}
				{...confirmState("draw")}
			/>
		) : null,
		newDraw: canViewDraw ? (
			<StartNewDrawControl groupId={group.id} groupName={group.name} {...confirmState("newDraw")} />
		) : null,
		delete: group.isOwner ? (
			<DeleteGroupControl groupId={group.id} groupName={group.name} {...confirmState("delete")} />
		) : null,
		leave: canLeave ? <LeaveGroupControl groupId={group.id} groupName={group.name} {...confirmState("leave")} /> : null,
	};
	const hasControls = Object.values(controls).some(Boolean);
	const message = statusMessage(group);

	return (
		<Card withBorder padding="lg" radius="md">
			<Group justify="space-between" align="flex-start" className={classes.header}>
				<div className={classes.nameColumn}>
					<GroupNameEditor groupId={group.id} name={group.name} canRename={group.isOwner} />
				</div>
				{group.isOwner && (
					<Group gap={4} wrap="nowrap" className={classes.ownerBadge}>
						<Badge color="green" variant="light">
							Owner
						</Badge>
						{/* Owner-only and destructive, so it lives in a menu instead of crowding the footer's
						    buttons; picking it opens the usual "are you sure?" panel there. */}
						<Menu position="bottom-end" withinPortal>
							<Menu.Target>
								<ActionIcon variant="subtle" color="gray" aria-label={`More actions for ${group.name}`}>
									<FontAwesomeIcon icon={faEllipsis} />
								</ActionIcon>
							</Menu.Target>
							<Menu.Dropdown>
								<Menu.Item
									color="red"
									leftSection={<FontAwesomeIcon icon={faTrashCan} />}
									onClick={() => setOpenAction("delete")}
								>
									Delete group
								</Menu.Item>
							</Menu.Dropdown>
						</Menu>
					</Group>
				)}
			</Group>
			<Group gap="md" mt={4}>
				<MantineText size="sm" c="dimmed">
					{group.membersCount} member{group.membersCount === 1 ? "" : "s"}
				</MantineText>
				<InviteCode code={group.joinCode} />
			</Group>
			<GroupDescription groupId={group.id} description={group.description} canEdit={group.isOwner} />
			<GroupMembers members={group.members} />

			<Card.Section inheritPadding py="md" mt="md" withBorder>
				<Stack gap="md">
					{group.myAssignment && (
						<AssignmentReveal
							recipientId={group.myAssignment.recipientId}
							recipientName={group.myAssignment.recipientName}
						/>
					)}

					{openAction
						? controls[openAction]
						: (hasControls || message) && (
								<Group justify="space-between" align="center">
									{canDraw ? (
										<Group gap="sm">
											{controls.draw}
											<Button variant="secondary" onClick={() => setExclusionsOpen(true)}>
												Exclusions
												{Boolean(group.exclusionsCount) && (
													<Badge size="sm" circle color="red" ml={6}>
														{group.exclusionsCount}
													</Badge>
												)}
											</Button>
										</Group>
									) : canViewDraw ? (
										<Group gap="sm">
											<Button variant="secondary" onClick={() => setDrawDetailsOpen(true)}>
												Draw details
											</Button>
											{controls.newDraw}
										</Group>
									) : message ? (
										<MantineText size="sm" c="dimmed" className={classes.footerMessage}>
											{message}
										</MantineText>
									) : (
										<span />
									)}
									{controls.leave && <div className={classes.endControl}>{controls.leave}</div>}
								</Group>
							)}
				</Stack>
			</Card.Section>
			{canViewDraw && (
				<DrawDetailsModal group={group} opened={drawDetailsOpen} onClose={() => setDrawDetailsOpen(false)} />
			)}
			{canDraw && <ExclusionsModal group={group} opened={exclusionsOpen} onClose={() => setExclusionsOpen(false)} />}
		</Card>
	);
}
