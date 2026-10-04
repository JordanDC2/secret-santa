import { useState } from "react";
import { Badge, Card, Group, Stack, Text as MantineText } from "@mantine/core";
import type { IGroup } from "Components/Groups/types";
import AssignmentReveal from "Components/Groups/AssignmentReveal";
import DeleteGroupControl from "Components/Groups/DeleteGroupControl";
import DrawDetailsModal from "Components/Groups/DrawDetailsModal";
import DrawNamesControl from "Components/Groups/DrawNamesControl";
import ExclusionsModal from "Components/Groups/ExclusionsModal";
import GroupActionsMenu, { type IGroupMenuAction } from "Components/Groups/GroupActionsMenu";
import GroupDescription from "Components/Groups/GroupDescription";
import GroupMembers from "Components/Groups/GroupMembers";
import GroupNameEditor from "Components/Groups/GroupNameEditor";
import InviteCode from "Components/Groups/InviteCode";
import LeaveGroupControl from "Components/Groups/LeaveGroupControl";
import StartNewDrawControl from "Components/Groups/StartNewDrawControl";
import { useLinkedSantaChat } from "Components/SantaChat/hooks";
import SantaChatButton from "Components/SantaChat/SantaChatButton";
import SantaChatModal from "Components/SantaChat/SantaChatModal";
import type { ISantaChatSide } from "Components/SantaChat/types";
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

/** The "are you sure?" panels; all but Draw Names are opened from the ⋯ menu. */
type IConfirmedAction = "draw" | "newDraw" | "delete" | "leave";

export default function GroupCard({ group }: IGroupCardProps) {
	// Only one "are you sure?" panel at a time, and it takes the whole footer.
	const [openAction, setOpenAction] = useState<IConfirmedAction | null>(null);
	const [exclusionsOpen, setExclusionsOpen] = useState(false);
	const [drawDetailsOpen, setDrawDetailsOpen] = useState(false);
	const [editingNote, setEditingNote] = useState(false);
	// A fresh key each time the chat opens, so it reloads its draft and scroll position.
	const [chat, setChat] = useState<{ side: ISantaChatSide; opened: boolean; key: number }>({
		side: "my-santa",
		opened: false,
		key: 0,
	});
	const { linkedSide, clearLink } = useLinkedSantaChat(group.id);
	const canViewDraw = group.isOwner && group.isDrawn;
	const canDraw = group.isOwner && !group.isDrawn;
	const canLeave = !group.isOwner && !group.isDrawn;

	function confirmState(action: IConfirmedAction) {
		return {
			confirming: openAction === action,
			onConfirmingChange: (confirming: boolean) => setOpenAction(confirming ? action : null),
		};
	}

	const controls: Record<IConfirmedAction, JSX.Element | null> = {
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

	function onMenuAction(action: IGroupMenuAction) {
		if (action === "exclusions") {
			setExclusionsOpen(true);
		} else if (action === "drawDetails") {
			setDrawDetailsOpen(true);
		} else {
			setOpenAction(action);
		}
	}

	function openChat(side: ISantaChatSide) {
		setChat((current) => ({ side, opened: true, key: current.key + 1 }));
	}

	// An email's "Open the Conversation" link lands here with ?group=…&chat=…, and opens
	// that chat until it's closed (which drops the link from the address).
	const linkedChat =
		(linkedSide === "my-person" && group.myAssignment) || (linkedSide === "my-santa" && group.mySanta)
			? linkedSide
			: null;

	function closeChat() {
		clearLink();
		setChat((current) => ({ ...current, opened: false }));
	}

	const message = statusMessage(group);
	const footer = openAction ? controls[openAction] : canDraw ? <div>{controls.draw}</div> : null;
	// A plain status line doesn't need the footer's divider; buttons and panels do.
	const hasFooter = Boolean(footer || group.myAssignment || group.mySanta);

	return (
		<Card withBorder padding="lg" radius="md">
			<Group justify="space-between" align="flex-start" className={classes.header}>
				<div className={classes.nameColumn}>
					<GroupNameEditor groupId={group.id} name={group.name} canRename={group.isOwner} />
				</div>
				<Group gap={4} wrap="nowrap" className={classes.headerEnd}>
					{group.isOwner && (
						<Badge color="green" variant="light">
							Owner
						</Badge>
					)}
					<GroupActionsMenu group={group} onAction={onMenuAction} />
				</Group>
			</Group>
			<Group gap="md" mt={4}>
				<MantineText size="sm" c="dimmed">
					{group.membersCount} member{group.membersCount === 1 ? "" : "s"}
				</MantineText>
				<InviteCode code={group.joinCode} />
				{group.isOwner && !group.description && !editingNote && (
					<Badge
						component="button"
						type="button"
						variant="light"
						color="gray"
						tt="none"
						className={classes.addNote}
						onClick={() => setEditingNote(true)}
					>
						+ Add note
					</Badge>
				)}
			</Group>
			<GroupDescription
				groupId={group.id}
				description={group.description}
				canEdit={group.isOwner}
				editing={editingNote}
				onEditingChange={setEditingNote}
			/>
			<GroupMembers members={group.members} />
			{!hasFooter && message && (
				<MantineText size="sm" c="dimmed" mt="sm">
					{message}
				</MantineText>
			)}

			{hasFooter && (
				<Card.Section inheritPadding py="md" mt="md" withBorder>
					<Stack gap="md">
						{/* Compact buttons side by side; a revealed assignment takes its own full-width row. */}
						{(group.myAssignment || group.mySanta) && (
							<Group gap="sm">
								{group.myAssignment && (
									<AssignmentReveal
										recipientId={group.myAssignment.recipientId}
										recipientName={group.myAssignment.recipientName}
										unreadMessages={group.myAssignment.unreadMessages}
										onAsk={() => openChat("my-person")}
									/>
								)}
								{group.mySanta && (
									<SantaChatButton unread={group.mySanta.unreadMessages} onClick={() => openChat("my-santa")}>
										Message your Santa
									</SantaChatButton>
								)}
							</Group>
						)}

						{footer}
					</Stack>
				</Card.Section>
			)}
			{canViewDraw && (
				<DrawDetailsModal group={group} opened={drawDetailsOpen} onClose={() => setDrawDetailsOpen(false)} />
			)}
			{(group.myAssignment || group.mySanta) && (
				<SantaChatModal
					key={chat.key}
					target={{ groupId: group.id, groupName: group.name, side: linkedChat ?? chat.side }}
					opened={chat.opened || linkedChat !== null}
					onClose={closeChat}
				/>
			)}
			{canDraw && <ExclusionsModal group={group} opened={exclusionsOpen} onClose={() => setExclusionsOpen(false)} />}
		</Card>
	);
}
