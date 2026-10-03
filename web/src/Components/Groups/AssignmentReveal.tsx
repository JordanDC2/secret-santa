import { useState } from "react";
import { Box, Button, Group, Text as MantineText } from "@mantine/core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEyeSlash } from "@fortawesome/free-regular-svg-icons";
import { Link } from "react-router-dom";
import { faEye, faListUl } from "@fortawesome/free-solid-svg-icons";
import classes from "Components/Groups/AssignmentReveal.module.less";

type IAssignmentRevealProps = {
	recipientId: number;
	recipientName: string;
};

export default function AssignmentReveal({ recipientId, recipientName }: IAssignmentRevealProps) {
	const [revealed, setRevealed] = useState(false);

	if (!revealed) {
		return (
			<Button
				variant="light"
				color="green"
				fullWidth
				leftSection={<FontAwesomeIcon icon={faEye} />}
				onClick={() => setRevealed(true)}
			>
				Reveal my assignment
			</Button>
		);
	}

	return (
		<Box className={classes.reveal}>
			<Group justify="space-between" gap="sm">
				<div>
					<MantineText size="xs" fw={700} tt="uppercase" c="dimmed" className={classes.label}>
						You&apos;re the Secret Santa for
					</MantineText>
					<div className={classes.name}>{recipientName}</div>
				</div>
				<Group gap="xs">
					<Button
						component={Link}
						to={`/wishlists/${recipientId}`}
						size="xs"
						color="green"
						leftSection={<FontAwesomeIcon icon={faListUl} />}
					>
						Wishlist
					</Button>
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
