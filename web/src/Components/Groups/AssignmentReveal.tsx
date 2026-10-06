import { useState } from "react";
import { Box, Button, Group } from "@mantine/core";
import Eyebrow from "Components/Common/Eyebrow";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Link } from "react-router-dom";
import { faEye, faEyeSlash, faListUl } from "@fortawesome/free-solid-svg-icons";
import SantaChatButton from "Components/SantaChat/SantaChatButton";
import UnreadBadge from "Components/SantaChat/UnreadBadge";
import classes from "Components/Groups/AssignmentReveal.module.less";

type IAssignmentRevealProps = {
	recipientId: number;
	recipientName: string;
	/** Unread messages from the recipient, counted even while the name is hidden. */
	unreadMessages: number;
	onAsk: () => void;
};

export default function AssignmentReveal({
	recipientId,
	recipientName,
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
			{/* The label gets its own line so the buttons can sit beside the name, not under it. */}
			<Eyebrow className={classes.label}>You&apos;re the Secret Santa for</Eyebrow>
			<Group justify="space-between" gap="sm">
				<div className={classes.name}>{recipientName}</div>
				<Group gap="xs" className={classes.actions}>
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
						Ask {recipientName}
					</SantaChatButton>
					<Button
						size="xs"
						variant="subtle"
						color="gray"
						leftSection={<FontAwesomeIcon icon={faEyeSlash} />}
						onClick={() => setRevealed(false)}
					>
						Hide
					</Button>
				</Group>
			</Group>
		</Box>
	);
}
