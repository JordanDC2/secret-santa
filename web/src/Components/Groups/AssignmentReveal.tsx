import { useState } from "react";
import { Button, Card, Stack, Text as MantineText, Title } from "@mantine/core";
import { Link } from "react-router-dom";

type IAssignmentRevealProps = {
	recipientId: number;
	recipientName: string;
};

export default function AssignmentReveal({ recipientId, recipientName }: IAssignmentRevealProps) {
	const [revealed, setRevealed] = useState(false);

	return (
		<Card withBorder mt="md" padding="sm" radius="md" bg={revealed ? "green.0" : undefined}>
			{revealed ? (
				<Stack gap={4}>
					<MantineText size="sm" c="dimmed">
						You&apos;re the Secret Santa for:
					</MantineText>
					<Title order={4}>🎁 {recipientName}</Title>
					<Button component={Link} to={`/wishlists/${recipientId}`} color="green" size="xs">
						📝 See their wishlist
					</Button>
					<Button variant="subtle" size="xs" onClick={() => setRevealed(false)}>
						Hide
					</Button>
				</Stack>
			) : (
				<Button variant="light" color="green" onClick={() => setRevealed(true)}>
					🎁 Reveal my assignment
				</Button>
			)}
		</Card>
	);
}
