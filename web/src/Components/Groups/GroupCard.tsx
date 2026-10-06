import { useState } from "react";
import { Badge, Card, Group, Stack, Text as MantineText } from "@mantine/core";
import { faChildren } from "@fortawesome/free-solid-svg-icons";
import { useAuth } from "Components/Auth/AuthContext";
import AddChip from "Components/Common/AddChip";
import type { IGroup } from "Components/Groups/types";
import AssignmentReveal from "Components/Groups/AssignmentReveal";
import DeleteGroupControl from "Components/Groups/DeleteGroupControl";
import DrawDetailsModal from "Components/Groups/DrawDetailsModal";
import DrawMembersModal from "Components/Groups/DrawMembersModal";
import DrawNamesControl from "Components/Groups/DrawNamesControl";
import ExchangeDetails from "Components/Groups/ExchangeDetails";
import ExchangeDetailsModal from "Components/Groups/ExchangeDetailsModal";
import ExchangeOverNotice from "Components/Groups/ExchangeOverNotice";
import { daysUntil } from "Components/Groups/exchange";
import ExclusionsModal from "Components/Groups/ExclusionsModal";
import GroupKidsModal from "Components/Groups/GroupKidsModal";
import ManagedAssignmentsModal from "Components/Groups/ManagedAssignmentsModal";
import { useManagedProfilesQuery } from "Components/ManagedProfiles/hooks";
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
function statusMessage(group: IGroup, myId: number | undefined): string | null {
	const sittingOut = group.members.find((member) => member.id === myId)?.inDraw === false;

	if (!group.isDrawn) {
		if (group.isOwner) {
			return null;
		}

		return sittingOut
			? "Waiting for the group owner to draw names. You're sitting this draw out."
			: "Waiting for the group owner to draw names.";
	}

	if (sittingOut) {
		return "You're sitting this draw out.";
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
	const [drawMembersOpen, setDrawMembersOpen] = useState(false);
	const { user } = useAuth();
	const [editingNote, setEditingNote] = useState(false);
	const canAddNote = !group.description && !editingNote;
	// A fresh key each time it opens, so the form starts from the group's current details.
	const [exchangeModal, setExchangeModal] = useState({ opened: false, key: 0 });
	// A fresh key each time the chat opens, so it reloads its draft and scroll position.
	const [chat, setChat] = useState<{
		side: ISantaChatSide;
		asProfile?: { id: number; name: string };
		opened: boolean;
		key: number;
	}>({
		side: "my-santa",
		opened: false,
		key: 0,
	});
	const { linkedSide, linkedAsProfileId, clearLink } = useLinkedSantaChat(group.id);
	const hasManagedProfiles = (useManagedProfilesQuery().data ?? []).length > 0;
	const [kidsOpen, setKidsOpen] = useState(false);
	const [managedOpen, setManagedOpen] = useState(false);
	const managedUnread = group.managedAssignments.reduce(
		(total, { recipient, santa }) => total + (recipient?.unreadMessages ?? 0) + (santa?.unreadMessages ?? 0),
		0,
	);
	const canViewDraw = group.isOwner && group.isDrawn;
	const canDraw = group.isOwner && !group.isDrawn;
	const canLeave = !group.isOwner;

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
		leave: canLeave ? <LeaveGroupControl group={group} {...confirmState("leave")} /> : null,
	};

	function openExchangeModal() {
		setExchangeModal((current) => ({ opened: true, key: current.key + 1 }));
	}

	function onMenuAction(action: IGroupMenuAction) {
		if (action === "exchange") {
			openExchangeModal();
		} else if (action === "drawMembers") {
			setDrawMembersOpen(true);
		} else if (action === "exclusions") {
			setExclusionsOpen(true);
		} else if (action === "drawDetails") {
			setDrawDetailsOpen(true);
		} else {
			setOpenAction(action);
		}
	}

	/** Opens one of your Santa chats, or (given a kid or pet) one of theirs. */
	function openChat(side: ISantaChatSide, asProfile?: { id: number; name: string }) {
		setChat((current) => ({ side, asProfile, opened: true, key: current.key + 1 }));
	}

	// An email's "Open the Conversation" link lands here with ?group=…&chat=… (and &as=… for a
	// kid's or pet's), and opens that chat until it's closed (which drops the link from the address).
	const linkedManaged = group.managedAssignments.find((managed) => managed.profile.id === linkedAsProfileId);
	const linkedThreadExists = linkedAsProfileId
		? (linkedSide === "my-person" && linkedManaged?.recipient) || (linkedSide === "my-santa" && linkedManaged?.santa)
		: (linkedSide === "my-person" && group.myAssignment) || (linkedSide === "my-santa" && group.mySanta);
	const linkedChat =
		linkedSide && linkedThreadExists
			? {
					side: linkedSide,
					asProfile: linkedManaged && { id: linkedManaged.profile.id, name: linkedManaged.profile.name },
				}
			: null;

	function closeChat() {
		clearLink();
		setChat((current) => ({ ...current, opened: false }));
	}

	const message = statusMessage(group, user?.id);
	const inDrawCount = group.members.filter((member) => member.inDraw).length;
	const exchangeOver = group.exchangeDate !== null && daysUntil(group.exchangeDate) < 0;
	const exchangeOverNotice =
		exchangeOver && group.exchangeDate !== null && (group.isDrawn || group.isOwner) ? (
			<ExchangeOverNotice
				group={{ ...group, exchangeDate: group.exchangeDate }}
				onStartNewDraw={() => setOpenAction("newDraw")}
				onSetDate={openExchangeModal}
			/>
		) : null;
	const footer = openAction ? controls[openAction] : canDraw ? <div>{controls.draw}</div> : null;
	// A plain status line doesn't need the footer's divider; buttons and panels do.
	const hasFooter = Boolean(
		footer || exchangeOverNotice || group.myAssignment || group.mySanta || group.managedAssignments.length > 0,
	);

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
					{inDrawCount < group.members.length && ` · ${inDrawCount} in the draw`}
				</MantineText>
				<InviteCode code={group.joinCode} groupName={group.name} />
			</Group>
			{/* Date & budget chips, plus the owner's "Add" chips for anything missing, in one row. */}
			<ExchangeDetails group={group} onEdit={group.isOwner ? openExchangeModal : undefined}>
				{group.isOwner && canAddNote && <AddChip onClick={() => setEditingNote(true)}>Add note</AddChip>}
			</ExchangeDetails>
			<GroupDescription
				groupId={group.id}
				description={group.description}
				canEdit={group.isOwner}
				editing={editingNote}
				onEditingChange={setEditingNote}
			/>
			<GroupMembers
				members={group.members}
				onManageKids={hasManagedProfiles && !group.isDrawn ? () => setKidsOpen(true) : undefined}
			/>
			{!hasFooter && message && (
				<MantineText size="sm" c="dimmed" mt="sm">
					{message}
				</MantineText>
			)}

			{hasFooter && (
				<Card.Section inheritPadding py="md" mt="md" withBorder>
					<Stack gap="md">
						{exchangeOverNotice}

						{/* E.g. "You're sitting this draw out", above your kids' and pets' button. */}
						{message && (
							<MantineText size="sm" c="dimmed">
								{message}
							</MantineText>
						)}

						{/* Compact buttons side by side (stacked, all the same width, on phones); a revealed
						    assignment takes its own full-width row. */}
						{(group.myAssignment || group.mySanta || group.managedAssignments.length > 0) && (
							<Group gap="sm" className={classes.footerButtons}>
								{group.myAssignment && (
									<AssignmentReveal
										recipientId={group.myAssignment.recipientId}
										recipientName={group.myAssignment.recipientName}
										recipientShortName={
											group.members.find((member) => member.id === group.myAssignment?.recipientId)?.name ??
											group.myAssignment.recipientName
										}
										unreadMessages={group.myAssignment.unreadMessages}
										onAsk={() => openChat("my-person")}
									/>
								)}
								{group.mySanta && (
									<SantaChatButton unread={group.mySanta.unreadMessages} onClick={() => openChat("my-santa")}>
										Message your Santa
									</SantaChatButton>
								)}
								{/* Every kid and pet you look after, behind one button however big the family. */}
								{group.managedAssignments.length > 0 && (
									<SantaChatButton icon={faChildren} unread={managedUnread} onClick={() => setManagedOpen(true)}>
										Kids &amp; pets
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
			{(group.myAssignment || group.mySanta || group.managedAssignments.length > 0) && (
				<SantaChatModal
					key={chat.key}
					target={{ groupId: group.id, groupName: group.name, ...(linkedChat ?? chat) }}
					opened={chat.opened || linkedChat !== null}
					onClose={closeChat}
				/>
			)}
			{group.isOwner && (
				<ExchangeDetailsModal
					key={exchangeModal.key}
					group={group}
					opened={exchangeModal.opened}
					onClose={() => setExchangeModal((current) => ({ ...current, opened: false }))}
				/>
			)}
			{group.managedAssignments.length > 0 && (
				<ManagedAssignmentsModal
					groupName={group.name}
					assignments={group.managedAssignments}
					opened={managedOpen}
					onClose={() => setManagedOpen(false)}
					onOpenChat={(side, asProfile) => {
						setManagedOpen(false);
						openChat(side, asProfile);
					}}
				/>
			)}
			{hasManagedProfiles && !group.isDrawn && (
				<GroupKidsModal group={group} opened={kidsOpen} onClose={() => setKidsOpen(false)} />
			)}
			{canDraw && <DrawMembersModal group={group} opened={drawMembersOpen} onClose={() => setDrawMembersOpen(false)} />}
			{canDraw && <ExclusionsModal group={group} opened={exclusionsOpen} onClose={() => setExclusionsOpen(false)} />}
		</Card>
	);
}
