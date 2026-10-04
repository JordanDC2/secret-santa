import { ActionIcon, Badge, Menu } from "@mantine/core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
	faArrowRightFromBracket,
	faArrowsRotate,
	faEllipsis,
	faListCheck,
	faTrashCan,
	faUserSlash,
} from "@fortawesome/free-solid-svg-icons";
import type { IGroup } from "Components/Groups/types";

/** Things the menu can ask the card to open: a modal, or an "are you sure?" panel in the footer. */
export type IGroupMenuAction = "exclusions" | "drawDetails" | "newDraw" | "delete" | "leave";

type IGroupActionsMenuProps = {
	group: IGroup;
	onAction: (action: IGroupMenuAction) => void;
};

/**
 * The card's less-used admin actions, kept out of the footer so it only holds what
 * people come for: drawing names, their assignment and their Santa chats.
 */
export default function GroupActionsMenu({ group, onAction }: IGroupActionsMenuProps) {
	const canLeave = !group.isOwner && !group.isDrawn;

	if (!group.isOwner && !canLeave) {
		return null;
	}

	return (
		<Menu position="bottom-end" withinPortal>
			<Menu.Target>
				<ActionIcon variant="subtle" color="gray" aria-label={`More actions for ${group.name}`}>
					<FontAwesomeIcon icon={faEllipsis} />
				</ActionIcon>
			</Menu.Target>
			<Menu.Dropdown>
				{group.isOwner && !group.isDrawn && (
					<Menu.Item
						leftSection={<FontAwesomeIcon icon={faUserSlash} fixedWidth />}
						rightSection={
							group.exclusionsCount ? (
								<Badge size="sm" circle color="red">
									{group.exclusionsCount}
								</Badge>
							) : undefined
						}
						onClick={() => onAction("exclusions")}
					>
						Exclusions
					</Menu.Item>
				)}
				{group.isOwner && group.isDrawn && (
					<>
						<Menu.Item
							leftSection={<FontAwesomeIcon icon={faListCheck} fixedWidth />}
							onClick={() => onAction("drawDetails")}
						>
							Draw details
						</Menu.Item>
						<Menu.Item
							leftSection={<FontAwesomeIcon icon={faArrowsRotate} fixedWidth />}
							onClick={() => onAction("newDraw")}
						>
							Start a new draw
						</Menu.Item>
					</>
				)}
				{group.isOwner && (
					<>
						<Menu.Divider />
						<Menu.Item
							color="red"
							leftSection={<FontAwesomeIcon icon={faTrashCan} fixedWidth />}
							onClick={() => onAction("delete")}
						>
							Delete group
						</Menu.Item>
					</>
				)}
				{canLeave && (
					<Menu.Item
						color="red"
						leftSection={<FontAwesomeIcon icon={faArrowRightFromBracket} fixedWidth />}
						onClick={() => onAction("leave")}
					>
						Leave group
					</Menu.Item>
				)}
			</Menu.Dropdown>
		</Menu>
	);
}
