import { useState } from "react";
import { ActionIcon, Box, Button, Group, Text as MantineText, Tooltip } from "@mantine/core";
import GiftBoxIcon from "Components/Common/FestiveIcons/GiftBoxIcon";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Link } from "react-router-dom";
import { faEye, faEyeSlash, faListUl } from "@fortawesome/free-solid-svg-icons";
import SantaChatButton from "Components/SantaChat/SantaChatButton";
import UnreadBadge from "Components/SantaChat/UnreadBadge";
import classes from "Components/Groups/AssignmentReveal.module.less";

type IAssignmentRevealProps = {
	recipientId: number;
	/** In full: there's no doubt who to shop for. */
	recipientName: string;
	/** As the group card names them (e.g. "Ivy", or "Nick C."), for the Ask button. */
	recipientShortName: string;
	/** Unread messages from the recipient, counted even while the name is hidden. */
	unreadMessages: number;
	onAsk: () => void;
};

export default function AssignmentReveal({
	recipientId,
	recipientName,
	recipientShortName,
	unreadMessages,
	onAsk,
}: IAssignmentRevealProps) {
	const [revealed, setRevealed] = useState(false);

	if (!revealed) {
		return (
			<Button
				leftSection={<FontAwesomeIcon icon={faEye} />}
				rightSection={unreadMessages > 0 ? <UnreadBadge count={unreadMessages} /> : undefined}
				onClick={() => setRevealed(true)}
			>
				Reveal my assignment
			</Button>
		);
	}

	return (
		<Box className={classes.reveal}>
			{/* Label and the eye on top; the name with the present before it, like a page title; then the buttons. */}
			<Group justify="space-between" wrap="nowrap" align="flex-start" gap="xs">
				<MantineText size="sm" c="dimmed">
					You&apos;re the Secret Santa for
				</MantineText>
				<Tooltip label="Hide" withArrow>
					<ActionIcon
						size="sm"
						variant="subtle"
						color="gray"
						aria-label="Hide who you drew"
						onClick={() => setRevealed(false)}
					>
						<FontAwesomeIcon icon={faEyeSlash} />
					</ActionIcon>
				</Tooltip>
			</Group>
			<div className={classes.name}>
				<GiftBoxIcon size="1em" />
				<span>{recipientName}</span>
			</div>
			<Group gap="xs" mt="xs">
				<Button
					component={Link}
					to={`/wishlists/${recipientId}`}
					size="xs"
					variant="secondary"
					leftSection={<FontAwesomeIcon icon={faListUl} />}
				>
					Wishlist
				</Button>
				<SantaChatButton size="xs" unread={unreadMessages} onClick={onAsk}>
					Ask {recipientShortName}
				</SantaChatButton>
			</Group>
		</Box>
	);
}
