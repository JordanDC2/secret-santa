import { useState } from "react";
import { Badge, Box, Button, Group, Text as MantineText } from "@mantine/core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEyeSlash } from "@fortawesome/free-regular-svg-icons";
import { Link } from "react-router-dom";
import { faEye, faListUl } from "@fortawesome/free-solid-svg-icons";
import SantaChatButton from "Components/SantaChat/SantaChatButton";
import classes from "Components/Groups/AssignmentReveal.module.less";

type IAssignmentRevealProps = {
	recipientId: number;
	recipientName: string;
	/** Unread messages from the recipient, counted even while the name is hidden. */
	unreadMessages: number;
	onAsk: () => void;
	/** A kid or pet you look after, whose assignment this is; omitted for your own. */
	santaName?: string;
};

export default function AssignmentReveal({
	recipientId,
	recipientName,
	unreadMessages,
	onAsk,
	santaName,
}: IAssignmentRevealProps) {
	const [revealed, setRevealed] = useState(false);

	if (!revealed) {
		return (
			<Button
				leftSection={<FontAwesomeIcon icon={faEye} />}
				rightSection={
					unreadMessages > 0 ? (
						<Badge size="sm" color="red" aria-label={`${unreadMessages} unread from your person`}>
							{unreadMessages} new
						</Badge>
					) : undefined
				}
				onClick={() => setRevealed(true)}
			>
				{santaName ? `Reveal ${santaName}'s assignment` : "Reveal my assignment"}
			</Button>
		);
	}

	return (
		<Box className={classes.reveal}>
			{/* The label gets its own line so the buttons can sit beside the name, not under it. */}
			<MantineText size="xs" fw={700} tt="uppercase" c="dimmed" className={classes.label}>
				{santaName ? `${santaName} is the Secret Santa for` : "You're the Secret Santa for"}
			</MantineText>
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
